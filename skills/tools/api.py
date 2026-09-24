#!/usr/bin/env python3
"""Sopwise Directory Studio API CLI — AI 调用 studio 接口的命令行工具。

用法:
  python skills/tools/api.py products [--status N]          列出产品
  python skills/tools/api.py product <id>                   查看产品详情
  python skills/tools/api.py add-product --name <name> [--url <url>] [--category-id <id>] [--pricing <p>] [--featured] [--slug <slug>] [--description <desc>]
  python skills/tools/api.py update-product <id> [--status N] [--name <name>] [--description <desc>] [--category-id <id>] [--pricing <p>] [--featured | --no-featured]
  python skills/tools/api.py delete-product <id>
  python skills/tools/api.py categories                          列出分类
  python skills/tools/api.py add-category --name <name> --slug <slug> --icon <icon>
  python skills/tools/api.py tags                                列出标签
  python skills/tools/api.py add-tag --name <name> --slug <slug>
  python skills/tools/api.py product-links <id>                列出产品链接
  python skills/tools/api.py add-link <product_id> --url <url> [--label <label>] [--primary]
  python skills/tools/api.py product-tags <id>                 查看产品标签
  python skills/tools/api.py set-tags <product_id> --tag-ids 1,2,3
  python skills/tools/api.py export                             导出 JSON
  python skills/tools/api.py stats                              目录总览统计
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

STUDIO_URL = os.environ.get("STUDIO_URL", "http://localhost:8000")
API_KEY = os.environ.get("API_KEY") or os.environ.get(
    "STUDIO_API_KEY", "dev-secret-key"
)

STATUS_NAMES = {0: "草稿", 1: "待审核", 2: "已发布", 3: "已下架"}


def _request(
    method: str, path: str, data: dict | None = None, need_auth: bool = False
) -> dict | list:
    url = f"{STUDIO_URL}/api/v1{path}"
    headers = {"Content-Type": "application/json"}
    if need_auth:
        headers["X-API-Key"] = API_KEY
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 204:
                return {}
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"连接失败: {e.reason}", file=sys.stderr)
        print(f"请确认 studio 已启动 (STUDIO_URL={STUDIO_URL})", file=sys.stderr)
        sys.exit(1)


def _print_json(data):
    print(json.dumps(data, ensure_ascii=False, indent=2))


def _print_table(items: list, columns: list[str]):
    if not items:
        print("  (空)")
        return
    widths = {
        c: max(len(c), max(len(str(item.get(c, ""))) for item in items))
        for c in columns
    }
    header = "  ".join(c.ljust(widths[c]) for c in columns)
    print(header)
    print("-" * len(header))
    for item in items:
        row = "  ".join(str(item.get(c, "")).ljust(widths[c]) for c in columns)
        print(row)


def cmd_products(args):
    params = []
    if args.status is not None:
        params.append(f"status={args.status}")
    if args.category_id:
        params.append(f"category_id={args.category_id}")
    if args.featured:
        params.append("featured=true")
    if args.page:
        params.append(f"page={args.page}")
    if args.page_size:
        params.append(f"page_size={args.page_size}")
    qs = "&".join(params)
    data = _request("GET", f"/products?{qs}" if qs else "/products")
    if args.json:
        _print_json(data)
    else:
        for p in data:
            p["status_name"] = STATUS_NAMES.get(p.get("status"), "?")
        _print_table(data, ["id", "name", "slug", "status_name", "pricing", "featured"])


def cmd_product(args):
    data = _request("GET", f"/products/{args.id}")
    _print_json(data)


def cmd_add_product(args):
    payload = {
        "slug": args.slug or args.name.lower().replace(" ", "-"),
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
    if args.description:
        payload["description"] = args.description
    data = _request("POST", "/products", payload)
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
    data = _request("PUT", f"/products/{args.id}", payload)
    _print_json(data)


def cmd_delete_product(args):
    _request("DELETE", f"/products/{args.id}")
    print(f"产品 {args.id} 已删除")


def cmd_categories(args):
    data = _request("GET", "/categories")
    if args.json:
        _print_json(data)
    else:
        _print_table(data, ["id", "name", "slug", "icon", "sort_order", "status"])


def cmd_add_category(args):
    data = _request(
        "POST",
        "/categories",
        {
            "slug": args.slug,
            "name": args.name,
            "icon": args.icon,
        },
    )
    _print_json(data)


def cmd_tags(args):
    data = _request("GET", "/tags")
    if args.json:
        _print_json(data)
    else:
        _print_table(data, ["id", "name", "slug"])


def cmd_add_tag(args):
    data = _request("POST", "/tags", {"slug": args.slug, "name": args.name})
    _print_json(data)


def cmd_product_links(args):
    data = _request("GET", f"/products/{args.id}/links")
    _print_table(data, ["id", "url", "label", "is_primary"])


def cmd_add_link(args):
    payload = {"url": args.url}
    if args.label:
        payload["label"] = args.label
    if args.primary:
        payload["is_primary"] = True
    data = _request("POST", f"/products/{args.product_id}/links", payload)
    _print_json(data)


def cmd_product_tags(args):
    data = _request("GET", f"/products/{args.id}")
    _print_table(data.get("tags", []), ["id", "name", "slug"])


def cmd_set_tags(args):
    tag_ids = [int(t) for t in args.tag_ids.split(",")]
    data = _request("PUT", f"/products/{args.product_id}/tags", {"tag_ids": tag_ids})
    _print_json(data)


def cmd_export(args):
    data = _request("POST", "/export", need_auth=True)
    _print_json(data)


def cmd_stats(args):
    all_products = []
    page = 1
    while True:
        data = _request("GET", f"/products?page={page}&page_size=100")
        all_products.extend(data)
        if len(data) < 100:
            break
        page += 1

    categories = _request("GET", "/categories")
    tags = _request("GET", "/tags")

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


def main():
    parser = argparse.ArgumentParser(description="Sopwise Directory Studio API CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    # products
    p = sub.add_parser("products", aliases=["p"], help="列出产品")
    p.add_argument("--status", type=int, choices=[0, 1, 2, 3], help="按状态过滤")
    p.add_argument("--category-id", type=int, help="按分类过滤")
    p.add_argument("--featured", action="store_true", help="仅精选")
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
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_categories)

    # add category
    p = sub.add_parser("add-category", help="添加分类")
    p.add_argument("--name", required=True)
    p.add_argument("--slug", required=True)
    p.add_argument("--icon", required=True)
    p.set_defaults(func=cmd_add_category)

    # tags
    p = sub.add_parser("tags", aliases=["t"], help="列出标签")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_tags)

    # add tag
    p = sub.add_parser("add-tag", help="添加标签")
    p.add_argument("--name", required=True)
    p.add_argument("--slug", required=True)
    p.set_defaults(func=cmd_add_tag)

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

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
