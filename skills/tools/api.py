#!/usr/bin/env python3
"""Sopwise Directory Studio API CLI — AI 调用 studio 接口的命令行工具。

用法:
  python skills/tools/api.py products [--status N] [--page N] [--page-size N] [--search K]  列出产品
  python skills/tools/api.py product <id>                   查看产品详情
  python skills/tools/api.py add-product --name <name> [--url <url>] [--category-id <id>] [--pricing <p>] [--featured] [--slug <slug>] [--description <desc>]
  python skills/tools/api.py update-product <id> [--status N] [--name <name>] [--description <desc>] [--category-id <id>] [--pricing <p>] [--featured | --no-featured]
  python skills/tools/api.py delete-product <id>
  python skills/tools/api.py categories [--page N] [--page-size N]       列出分类
  python skills/tools/api.py category <id>              查看分类详情
  python skills/tools/api.py add-category --name <name> --slug <slug> --icon <icon>
  python skills/tools/api.py update-category <id> [--name <name>] [--slug <slug>]
  python skills/tools/api.py delete-category <id>
  python skills/tools/api.py category-count <id>        分类产品数
  python skills/tools/api.py tags [--page N] [--page-size N]             列出标签
  python skills/tools/api.py tag <id>                   查看标签详情
  python skills/tools/api.py add-tag --name <name> --slug <slug>
  python skills/tools/api.py update-tag <id> [--name <name>] [--slug <slug>]
  python skills/tools/api.py delete-tag <id>
  python skills/tools/api.py tag-count <id>             标签产品数
  python skills/tools/api.py product-links <id>         列出产品链接
  python skills/tools/api.py add-link <product_id> --url <url> [--label <label>] [--primary]
  python skills/tools/api.py update-link <product_id> <link_id> [--url <url>] [--label] [--primary]
  python skills/tools/api.py delete-link <product_id> <link_id>
  python skills/tools/api.py product-tags <id>          查看产品标签
  python skills/tools/api.py set-tags <product_id> --tag-ids 1,2,3
  python skills/tools/api.py export                    导出 JSON
  python skills/tools/api.py stats                     目录总览统计
  python skills/tools/api.py health                    健康检查
  python skills/tools/api.py env                       环境信息
  python skills/tools/api.py --version                 显示版本

所有写操作支持 --dry-run 预览、--op-id 幂等、自动重试、操作日志。
注意: 写操作 (POST/PUT/DELETE) 不自动重试，避免重复写入。
"""

__version__ = "1.1.0"

import argparse
import json
import logging
import os
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

STUDIO_URL = os.environ.get("STUDIO_URL", "http://localhost:8000")

_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
_STUDIO_DIR = os.path.join(_PROJECT_ROOT, "studio")

_GLOBAL_ARGS: argparse.Namespace | None = None
_resolved_key: str | None = None
_backend_env: str | None = None

_TOOL_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(_TOOL_DIR, "api.log")
OP_IDS_FILE = os.path.join(_TOOL_DIR, ".op_ids")

_MAX_RETRIES = 3
_RETRY_DELAYS = [1, 2, 4]
_OP_IDS_MAX = 500
_MAX_FETCH_PAGES = 50

STATUS_NAMES = {0: "草稿", 1: "待审核", 2: "已发布", 3: "已下架"}


def _slugify(text: str) -> str:
    import re
    import unicodedata

    text = unicodedata.normalize("NFKC", text).strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    if text and re.match(r"^[a-z0-9-]+$", text):
        return text
    return re.sub(r"[^a-z0-9-]", "", text) or f"item-{secrets.token_hex(4)}"


logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("api")


def _load_op_ids() -> set[str]:
    if not os.path.exists(OP_IDS_FILE):
        return set()
    with open(OP_IDS_FILE) as f:
        return {line.strip() for line in f if line.strip()}


def _load_op_ids_ordered() -> list[str]:
    if not os.path.exists(OP_IDS_FILE):
        return []
    with open(OP_IDS_FILE) as f:
        seen = set()
        result = []
        for line in f:
            v = line.strip()
            if v and v not in seen:
                seen.add(v)
                result.append(v)
        return result


def _save_op_id(op_id: str):
    existing = _load_op_ids_ordered()
    if op_id in existing:
        return
    existing.append(op_id)
    if len(existing) > _OP_IDS_MAX:
        existing = existing[-_OP_IDS_MAX:]
    with open(OP_IDS_FILE, "w") as f:
        f.write("\n".join(existing) + "\n")


class CancelledError(SystemExit):
    def __init__(self):
        super().__init__(130)


def _confirm(prompt: str) -> bool:
    resp = input(f"  ⚠ {prompt} [y/N] ").strip().lower()
    return resp in ("y", "yes")


def _load_api_key_from_envfile(app_env: str) -> str:
    """从 studio/.env.{app_env} 读取 API_KEY 行。"""
    env_file = os.path.join(_STUDIO_DIR, f".env.{app_env}")
    if not os.path.exists(env_file):
        return ""
    try:
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("API_KEY="):
                    return line[len("API_KEY=") :].strip().strip("'\"")
    except OSError:
        pass
    return ""


def _detect_backend_env() -> str:
    """调用后端公开端点 /api/v1/env 获取当前后端环境 (dev/sit/prod)。

    CLI 据此后端环境读取对应的 studio/.env.{env}，确保与后端不脱节。
    结果缓存到 _backend_env，供生产环境保护逻辑使用。
    """
    global _backend_env
    if _backend_env is not None:
        return _backend_env
    url = f"{STUDIO_URL}/api/v1/env"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            _backend_env = data.get("env", "")
            return _backend_env
    except (urllib.error.URLError, ValueError, OSError):
        _backend_env = ""
        return ""


def _resolve_api_key() -> str:
    """解析 API Key。优先级: API_KEY > STUDIO_API_KEY > 自动探测后端环境读取 .env.{env}。"""
    global _resolved_key
    if _resolved_key:
        return _resolved_key
    key = os.environ.get("API_KEY") or os.environ.get("STUDIO_API_KEY", "")
    src = "环境变量"
    if not key:
        app_env = _detect_backend_env()
        if app_env:
            key = _load_api_key_from_envfile(app_env)
            src = f"studio/.env.{app_env}"
    if key:
        _resolved_key = key
        logger.info("API Key 来源: %s", src)
    return key


def _request(
    method: str, path: str, data: dict | None = None, need_auth: bool = False
) -> dict | list:
    result, _ = _request_with_headers(method, path, data, need_auth=need_auth)
    return result


def _request_with_headers(
    method: str, path: str, data: dict | None = None, need_auth: bool = False
) -> tuple[dict | list, dict]:
    url = f"{STUDIO_URL}/api/v1{path}"
    headers = {"Content-Type": "application/json"}
    if need_auth:
        api_key = _resolve_api_key()
        if not api_key:
            print("错误: 无法获取 API Key", file=sys.stderr)
            print(
                "  已尝试: 环境变量 API_KEY/STUDIO_API_KEY、自动探测后端 /api/v1/env 读取 .env.{env}",
                file=sys.stderr,
            )
            print("  请设置: export STUDIO_API_KEY=你的密钥", file=sys.stderr)
            print("  或确认 studio 已启动 (以便自动探测后端环境)", file=sys.stderr)
            sys.exit(2)
        headers["X-API-Key"] = api_key
    body = json.dumps(data).encode("utf-8") if data else None

    is_write = method in ("POST", "PUT", "DELETE")
    can_retry = not is_write

    for attempt in range(1, _MAX_RETRIES + 1):
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                resp_headers = {k.lower(): v for k, v in resp.headers.items()}
                if resp.status == 204:
                    return {}, resp_headers
                return json.loads(resp.read().decode("utf-8")), resp_headers
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            if 500 <= e.code < 600 and can_retry:
                if attempt < _MAX_RETRIES:
                    delay = _RETRY_DELAYS[attempt - 1]
                    logger.warning(
                        "重试 %d/%d: %s %s (等待 %ds)",
                        attempt,
                        _MAX_RETRIES,
                        method,
                        path,
                        delay,
                    )
                    time.sleep(delay)
                    continue
            else:
                logger.error(
                    "请求失败: %s %s → %d %s", method, path, e.code, error_body
                )
                print(f"HTTP {e.code}: {error_body}", file=sys.stderr)
                sys.exit(1)
        except urllib.error.URLError as e:
            if can_retry and attempt < _MAX_RETRIES:
                delay = _RETRY_DELAYS[attempt - 1]
                logger.warning(
                    "重试 %d/%d: %s %s (等待 %ds)",
                    attempt,
                    _MAX_RETRIES,
                    method,
                    path,
                    delay,
                )
                time.sleep(delay)
                continue
            err_msg = f"连接失败: {e.reason}"
            logger.error("连接失败: %s %s → %s", method, path, err_msg)
            print(err_msg, file=sys.stderr)
            print(f"请确认 studio 已启动 (STUDIO_URL={STUDIO_URL})", file=sys.stderr)
            sys.exit(1)

    logger.error("重试耗尽: %s %s", method, path)
    print("重试耗尽", file=sys.stderr)
    sys.exit(1)


def _write(
    method: str,
    path: str,
    payload: dict,
    *,
    need_auth: bool = True,
    summary: str = "",
    confirm: str = "",
) -> tuple[bool, dict | list]:
    assert _GLOBAL_ARGS is not None
    args = _GLOBAL_ARGS
    op_id = args.op_id or secrets.token_hex(8)

    if args.dry_run:
        print(f"  [DRY-RUN] {method} /api/v1{path}")
        print(f"  [DRY-RUN] 参数: {json.dumps(payload, ensure_ascii=False)}")
        logger.info(
            "DRY-RUN op_id=%s %s %s %s",
            op_id,
            method,
            path,
            json.dumps(payload, ensure_ascii=False),
        )
        return False, {}

    _parsed = urllib.parse.urlparse(STUDIO_URL)
    _target_local = _parsed.hostname in ("localhost", "127.0.0.1", "0.0.0.0")
    backend_env = ""
    if not _target_local:
        backend_env = _detect_backend_env()
    if backend_env == "prod":
        print("  ⚠⚠⚠ 当前为生产环境 (prod) ⚠⚠⚠", file=sys.stderr)
        print(f"  操作: {method} /api/v1{path}", file=sys.stderr)
        if not args.yes:
            print("  生产环境保护: 写操作必须显式 --yes 确认", file=sys.stderr)
            sys.exit(3)
        if method == "DELETE" and not getattr(args, "prod_confirm", False):
            print("  生产环境保护: DELETE 必须加 --prod-confirm 标志", file=sys.stderr)
            sys.exit(3)
        logger.warning("PROD 写操作 op_id=%s %s %s", op_id, method, path)

    completed = _load_op_ids()
    if op_id in completed:
        logger.info("跳过(已执行) op_id=%s %s %s", op_id, method, path)
        print(f"  - 操作已执行过 (op_id={op_id})，跳过")
        return False, {}

    if confirm and not args.yes:
        print(f"  操作: {summary}")
        if not _confirm(confirm):
            print("  已取消")
            logger.info("取消 op_id=%s %s %s", op_id, method, path)
            raise CancelledError()

    result = _request(method, path, payload, need_auth=need_auth)
    _save_op_id(op_id)
    logger.info(
        "SUCCESS op_id=%s %s %s → %s",
        op_id,
        method,
        path,
        json.dumps(result, ensure_ascii=False, default=str),
    )
    return True, result


def _print_json(data):
    print(json.dumps(data, ensure_ascii=False, indent=2))


def _display_width(s: str) -> int:
    return sum(2 if ord(c) > 127 else 1 for c in s)


def _pad_to_width(s: str, width: int) -> str:
    pad = width - _display_width(s)
    return s + " " * max(0, pad)


def _print_table(items: list, columns: list[str], headers: dict | None = None):
    if not items:
        print("  (空)")
        return
    display_headers = headers or {c: c for c in columns}
    widths = {
        c: max(
            _display_width(display_headers[c]),
            max(_display_width(str(item.get(c, ""))) for item in items),
        )
        for c in columns
    }
    header = "  ".join(_pad_to_width(display_headers[c], widths[c]) for c in columns)
    print(header)
    print("-" * _display_width(header))
    for item in items:
        row = "  ".join(_pad_to_width(str(item.get(c, "")), widths[c]) for c in columns)
        print(row)


def _print_total_info(resp_headers: dict):
    total = resp_headers.get("x-total-count")
    if total:
        print(f"  (共 {total} 条)")


def cmd_products(args):
    params = []
    if args.status is not None:
        params.append(f"status={args.status}")
    if args.category_id:
        params.append(f"category_id={args.category_id}")
    if args.featured:
        params.append("featured=true")
    if args.search:
        params.append(f"search={urllib.parse.quote(args.search)}")
    if args.page:
        params.append(f"page={args.page}")
    if args.page_size:
        params.append(f"page_size={args.page_size}")
    qs = "&".join(params)
    data, resp_headers = _request_with_headers(
        "GET", f"/products?{qs}" if qs else "/products"
    )
    if args.search and "search" not in resp_headers.get("x-supported-params", ""):
        all_data = _fetch_all("/products")
        data = [
            p
            for p in all_data
            if args.search.lower() in p.get("name", "").lower()
            or args.search.lower() in p.get("slug", "").lower()
        ]
        resp_headers = {}
    if args.json:
        _print_json(data)
    else:
        for p in data:
            p["status_name"] = STATUS_NAMES.get(p.get("status"), "?")
        _print_table(
            data,
            ["id", "name", "slug", "status_name", "pricing", "featured"],
            headers={
                "id": "ID",
                "name": "名称",
                "slug": "Slug",
                "status_name": "状态",
                "pricing": "定价",
                "featured": "精选",
            },
        )
        _print_total_info(resp_headers)


def cmd_product(args):
    data = _request("GET", f"/products/{args.id}")
    _print_json(data)


def cmd_add_product(args):
    payload = {
        "slug": args.slug if args.slug else _slugify(args.name),
        "name": args.name,
    }
    if args.url:
        payload["links"] = [{"url": args.url, "is_primary": True}]
    if args.category_id:
        payload["category_id"] = args.category_id
    if args.pricing:
        payload["pricing"] = args.pricing
    if args.featured:
        payload["featured"] = True
    if args.description is not None:
        payload["description"] = args.description
    _, data = _write("POST", "/products", payload, summary=f"添加产品: {args.name}")
    if data:
        _print_json(data)


def cmd_update_product(args):
    payload = {}
    if args.status is not None:
        payload["status"] = args.status
    if args.name:
        payload["name"] = args.name
    if args.description is not None:
        payload["description"] = args.description
    if args.category_id is not None:
        payload["category_id"] = args.category_id
    if args.pricing:
        payload["pricing"] = args.pricing
    if args.featured is not None:
        payload["featured"] = args.featured

    confirm_text = ""
    if args.status is not None:
        old = _request("GET", f"/products/{args.id}")
        old_status_name = STATUS_NAMES.get(old.get("status"), "?")
        new_status_name = STATUS_NAMES.get(args.status, "?")
        summary = f"更新产品 {args.id}: 状态 {old_status_name}→{new_status_name}"
        confirm_text = (
            f"将产品 {args.id} 从「{old_status_name}」改为「{new_status_name}」?"
        )
    else:
        keys = ", ".join(payload.keys())
        summary = f"更新产品 {args.id}: {keys}"

    _, data = _write(
        "PUT", f"/products/{args.id}", payload, summary=summary, confirm=confirm_text
    )
    if data:
        _print_json(data)


def cmd_delete_product(args):
    old = _request("GET", f"/products/{args.id}")
    name = old.get("name", f"ID={args.id}")
    summary = f"删除产品: {name}"
    executed, _ = _write(
        "DELETE",
        f"/products/{args.id}",
        {},
        summary=summary,
        confirm=f"确认删除产品「{name}」? 此操作不可恢复!",
    )
    if executed:
        print(f"产品 {args.id} 已删除")


def cmd_categories(args):
    params = []
    if args.page:
        params.append(f"page={args.page}")
    if args.page_size:
        params.append(f"page_size={args.page_size}")
    qs = "&".join(params)
    data, resp_headers = _request_with_headers(
        "GET", f"/categories?{qs}" if qs else "/categories"
    )
    if args.json:
        _print_json(data)
    else:
        _print_table(
            data,
            ["id", "name", "slug", "icon", "sort_order", "status"],
            headers={
                "id": "ID",
                "name": "名称",
                "slug": "Slug",
                "icon": "图标",
                "sort_order": "排序",
                "status": "状态",
            },
        )
        _print_total_info(resp_headers)


def cmd_add_category(args):
    payload = {"slug": args.slug, "name": args.name, "icon": args.icon}
    _, data = _write("POST", "/categories", payload, summary=f"添加分类: {args.name}")
    if data:
        _print_json(data)


def cmd_tags(args):
    params = []
    if args.page:
        params.append(f"page={args.page}")
    if args.page_size:
        params.append(f"page_size={args.page_size}")
    qs = "&".join(params)
    data, resp_headers = _request_with_headers("GET", f"/tags?{qs}" if qs else "/tags")
    if args.json:
        _print_json(data)
    else:
        _print_table(
            data,
            ["id", "name", "slug"],
            headers={"id": "ID", "name": "名称", "slug": "Slug"},
        )
        _print_total_info(resp_headers)


def cmd_add_tag(args):
    payload = {"slug": args.slug, "name": args.name}
    _, data = _write("POST", "/tags", payload, summary=f"添加标签: {args.name}")
    if data:
        _print_json(data)


def cmd_product_links(args):
    data = _request("GET", f"/products/{args.id}/links")
    _print_table(
        data,
        ["id", "url", "label", "is_primary"],
        headers={"id": "ID", "url": "URL", "label": "标签", "is_primary": "主链接"},
    )


def cmd_add_link(args):
    payload = {"url": args.url}
    if args.label:
        payload["label"] = args.label
    if args.primary:
        payload["is_primary"] = True
    _, data = _write(
        "POST",
        f"/products/{args.product_id}/links",
        payload,
        summary=f"添加链接: {args.url}",
    )
    if data:
        _print_json(data)


def cmd_product_tags(args):
    data = _request("GET", f"/products/{args.id}")
    _print_table(
        data.get("tags", []),
        ["id", "name", "slug"],
        headers={"id": "ID", "name": "名称", "slug": "Slug"},
    )


def cmd_set_tags(args):
    try:
        tag_ids = [int(t.strip()) for t in args.tag_ids.split(",") if t.strip()]
    except ValueError:
        print("错误: --tag-ids 格式无效，需逗号分隔的数字 (如 1,2,3)", file=sys.stderr)
        sys.exit(1)
    if not tag_ids:
        print("错误: --tag-ids 不能为空", file=sys.stderr)
        sys.exit(1)
    payload = {"tag_ids": tag_ids}
    _, data = _write(
        "PUT",
        f"/products/{args.product_id}/tags",
        payload,
        summary=f"设置标签: {args.product_id} → {tag_ids}",
    )
    if data:
        _print_json(data)


def cmd_export(args):
    data = _request("POST", "/export", need_auth=True)
    _print_json(data)


def _fetch_all(path: str, page_size: int = 100) -> list:
    results = []
    page = 1
    while page <= _MAX_FETCH_PAGES:
        data, _ = _request_with_headers(
            "GET", f"{path}?page={page}&page_size={page_size}"
        )
        results.extend(data)
        if len(data) < page_size:
            break
        page += 1
    return results


def cmd_stats(args):
    all_products = _fetch_all("/products")
    categories = _fetch_all("/categories", page_size=200)
    tags = _fetch_all("/tags", page_size=500)

    status_counts = {0: 0, 1: 0, 2: 0, 3: 0}
    for p in all_products:
        s = p.get("status", 0)
        status_counts[s] = status_counts.get(s, 0) + 1

    print("═══ Sopwise Directory 统计 ═══")
    print(f"  分类总数: {len(categories)}")
    print(f"  标签总数: {len(tags)}")
    print(f"  产品总数: {len(all_products)}")
    print()
    print("  产品状态分布:")
    for s, name in STATUS_NAMES.items():
        print(f"    {name} (status={s}): {status_counts.get(s, 0)}")


def cmd_health(args):
    data = _request("GET", "/health")
    backend_env = _detect_backend_env()
    data["env"] = backend_env
    _print_json(data)
    if backend_env == "prod":
        print("  ⚠⚠⚠ 生产环境 (prod): 写操作需 --yes, DELETE 需 --prod-confirm ⚠⚠⚠")


def cmd_env(args):
    data = _request("GET", "/env")
    _print_json(data)


def cmd_category(args):
    data = _request("GET", f"/categories/{args.id}")
    _print_json(data)


def cmd_update_category(args):
    payload = {}
    if args.name is not None:
        payload["name"] = args.name
    if args.slug is not None:
        payload["slug"] = args.slug
    if args.icon is not None:
        payload["icon"] = args.icon
    if args.sort_order is not None:
        payload["sort_order"] = args.sort_order
    if args.status is not None:
        payload["status"] = args.status
    _, data = _write(
        "PUT", f"/categories/{args.id}", payload, summary=f"更新分类: {args.id}"
    )
    if data:
        _print_json(data)


def cmd_delete_category(args):
    executed, _ = _write(
        "DELETE",
        f"/categories/{args.id}",
        {},
        summary=f"删除分类: {args.id}",
        confirm=f"确认删除分类 {args.id}? 此操作不可恢复!",
    )
    if executed:
        print(f"分类 {args.id} 已删除")


def cmd_category_count(args):
    data = _request("GET", f"/categories/{args.id}/count")
    print(f"产品数: {data.get('product_count', 0)}")


def cmd_tag(args):
    data = _request("GET", f"/tags/{args.id}")
    _print_json(data)


def cmd_update_tag(args):
    payload = {}
    if args.name is not None:
        payload["name"] = args.name
    if args.slug is not None:
        payload["slug"] = args.slug
    _, data = _write("PUT", f"/tags/{args.id}", payload, summary=f"更新标签: {args.id}")
    if data:
        _print_json(data)


def cmd_delete_tag(args):
    executed, _ = _write(
        "DELETE",
        f"/tags/{args.id}",
        {},
        summary=f"删除标签: {args.id}",
        confirm=f"确认删除标签 {args.id}?",
    )
    if executed:
        print(f"标签 {args.id} 已删除")


def cmd_tag_count(args):
    data = _request("GET", f"/tags/{args.id}/count")
    print(f"产品数: {data.get('product_count', 0)}")


def cmd_update_link(args):
    payload = {}
    if args.url is not None:
        payload["url"] = args.url
    if args.label is not None:
        payload["label"] = args.label
    if args.primary is not None:
        payload["is_primary"] = args.primary
    _, data = _write(
        "PUT",
        f"/products/{args.product_id}/links/{args.link_id}",
        payload,
        summary=f"更新链接: {args.link_id}",
    )
    if data:
        _print_json(data)


def cmd_delete_link(args):
    executed, _ = _write(
        "DELETE",
        f"/products/{args.product_id}/links/{args.link_id}",
        {},
        summary=f"删除链接: {args.link_id}",
        confirm=f"确认删除链接 {args.link_id}?",
    )
    if executed:
        print(f"链接 {args.link_id} 已删除")


def main():
    parser = argparse.ArgumentParser(description="XiGee Directory Studio API CLI")
    parser.add_argument(
        "--version", action="version", version=f"%(prog)s {__version__}"
    )
    parser.add_argument("--dry-run", action="store_true", help="预览模式，不实际写入")
    parser.add_argument("--yes", action="store_true", help="跳过二次确认")
    parser.add_argument(
        "--prod-confirm",
        action="store_true",
        help="生产环境 DELETE 显式确认",
    )
    parser.add_argument("--op-id", help="幂等键，相同 op_id 的操作不会重复执行")
    sub = parser.add_subparsers(dest="command", required=True)

    # products
    p = sub.add_parser("products", aliases=["p"], help="列出产品")
    p.add_argument("--status", type=int, choices=[0, 1, 2, 3], help="按状态过滤")
    p.add_argument("--category-id", type=int, help="按分类过滤")
    p.add_argument("--featured", action="store_true", help="仅精选")
    p.add_argument("--search", help="按名称/slug 搜索")
    p.add_argument("--page", type=int, default=1)
    p.add_argument("--page-size", type=int, default=20)
    p.add_argument("--json", action="store_true", help="输出 JSON")
    p.set_defaults(func=cmd_products)

    # product detail
    p = sub.add_parser("product", help="查看产品详情")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_product)

    # add product
    p = sub.add_parser("add-product", help="添加产品")
    p.add_argument("--name", required=True)
    p.add_argument("--slug", help="默认从 name 生成")
    p.add_argument("--url", help="产品链接")
    p.add_argument("--category-id", type=int)
    p.add_argument("--pricing", choices=["free", "freemium", "paid", "opensource"])
    p.add_argument("--featured", action="store_true")
    p.add_argument("--description")
    p.set_defaults(func=cmd_add_product)

    # update product
    p = sub.add_parser("update-product", help="更新产品")
    p.add_argument("id", type=int)
    p.add_argument("--status", type=int, choices=[0, 1, 2, 3])
    p.add_argument("--name")
    p.add_argument("--description")
    p.add_argument("--category-id", type=int)
    p.add_argument("--pricing", choices=["free", "freemium", "paid", "opensource"])
    p.add_argument("--featured", action=argparse.BooleanOptionalAction, default=None)
    p.set_defaults(func=cmd_update_product)

    # delete product
    p = sub.add_parser("delete-product", help="删除产品")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_delete_product)

    # categories
    p = sub.add_parser("categories", aliases=["c"], help="列出分类")
    p.add_argument("--page", type=int, default=1)
    p.add_argument("--page-size", type=int, default=50)
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_categories)

    # category detail
    p = sub.add_parser("category", help="查看分类详情")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_category)

    # add category
    p = sub.add_parser("add-category", help="添加分类")
    p.add_argument("--name", required=True)
    p.add_argument("--slug", required=True)
    p.add_argument("--icon", required=True)
    p.set_defaults(func=cmd_add_category)

    # update category
    p = sub.add_parser("update-category", help="更新分类")
    p.add_argument("id", type=int)
    p.add_argument("--name")
    p.add_argument("--slug")
    p.add_argument("--icon")
    p.add_argument("--sort-order", type=int)
    p.add_argument("--status", type=int, choices=[0, 1])
    p.set_defaults(func=cmd_update_category)

    # delete category
    p = sub.add_parser("delete-category", help="删除分类")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_delete_category)

    # category count
    p = sub.add_parser("category-count", help="分类下产品数")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_category_count)

    # tags
    p = sub.add_parser("tags", aliases=["t"], help="列出标签")
    p.add_argument("--page", type=int, default=1)
    p.add_argument("--page-size", type=int, default=100)
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_tags)

    # tag detail
    p = sub.add_parser("tag", help="查看标签详情")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_tag)

    # add tag
    p = sub.add_parser("add-tag", help="添加标签")
    p.add_argument("--name", required=True)
    p.add_argument("--slug", required=True)
    p.set_defaults(func=cmd_add_tag)

    # update tag
    p = sub.add_parser("update-tag", help="更新标签")
    p.add_argument("id", type=int)
    p.add_argument("--name")
    p.add_argument("--slug")
    p.set_defaults(func=cmd_update_tag)

    # delete tag
    p = sub.add_parser("delete-tag", help="删除标签")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_delete_tag)

    # tag count
    p = sub.add_parser("tag-count", help="标签下产品数")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_tag_count)

    # product links
    p = sub.add_parser("product-links", help="列出产品链接")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_product_links)

    # add link
    p = sub.add_parser("add-link", help="添加产品链接")
    p.add_argument("product_id", type=int)
    p.add_argument("--url", required=True)
    p.add_argument("--label")
    p.add_argument("--primary", action="store_true")
    p.set_defaults(func=cmd_add_link)

    # update link
    p = sub.add_parser("update-link", help="更新产品链接")
    p.add_argument("product_id", type=int)
    p.add_argument("link_id", type=int)
    p.add_argument("--url")
    p.add_argument("--label")
    p.add_argument("--primary", action=argparse.BooleanOptionalAction, default=None)
    p.set_defaults(func=cmd_update_link)

    # delete link
    p = sub.add_parser("delete-link", help="删除产品链接")
    p.add_argument("product_id", type=int)
    p.add_argument("link_id", type=int)
    p.set_defaults(func=cmd_delete_link)

    # product tags
    p = sub.add_parser("product-tags", help="查看产品标签")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_product_tags)

    # set tags
    p = sub.add_parser("set-tags", help="设置产品标签")
    p.add_argument("product_id", type=int)
    p.add_argument("--tag-ids", required=True, help="逗号分隔的标签 ID")
    p.set_defaults(func=cmd_set_tags)

    # export
    p = sub.add_parser("export", help="导出 JSON")
    p.set_defaults(func=cmd_export)

    # stats
    p = sub.add_parser("stats", help="目录统计")
    p.set_defaults(func=cmd_stats)

    # health
    p = sub.add_parser("health", help="健康检查")
    p.set_defaults(func=cmd_health)

    # env
    p = sub.add_parser("env", help="环境信息")
    p.set_defaults(func=cmd_env)

    global _GLOBAL_ARGS
    args = parser.parse_args()
    _GLOBAL_ARGS = args
    args.func(args)


if __name__ == "__main__":
    main()
