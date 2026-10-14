import hashlib
from urllib.parse import urlsplit, urlunsplit

from url_normalize import url_normalize

# 地址白名单,不是监听地址(pyproject 里为此豁免 S104)。app/schemas/models.py 校验 url
# 时用的也是这一份:两处各写一份迟早漂移,漂移的后果是"校验放行 http,归一化却改成 https"。
LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "0.0.0.0"})
# 默认端口要按【输入 scheme】判断,不能用 {80, 443} 的集合一刀切:
# 集合会把 https://host:80/ 也当成冗余端口删掉,那等于把链接悄悄改到 443 端口。
_DEFAULT_PORTS = {"https": 443, "http": 80}
# scheme 白名单。没有它, 第 7 条"去掉 userinfo"反而会【造出】 userinfo:
#   mailto:a@b.c        -> https://a@b.c/      (a@b.c 被当成 userinfo@host)
#   ftp://example.com/x -> https://example.com/x
# 空 scheme 允许(example.com/foo 这种省略写法), 其余一律拒绝。
_ALLOWED_SCHEMES = frozenset({"http", "https"})


class InvalidURLError(ValueError):
    """URL 格式非法(如端口非数字), 调用方应返回 400."""


def normalize_url(raw_url: str) -> str:
    """归一化 URL。11 条规则(schema.sql 的链接表注释是同一套,改这里要同步那边):

      1. 非本地地址强制 https;localhost / 127.0.0.1 / ::1 / 0.0.0.0 用 http
      2. 域名转小写
      3. 去掉 www. 前缀
      4. 去掉输入 scheme 自己的默认端口(:443 / :80),其余端口保留
      5. 去掉尾部 /(根路径除外)
      6. 去掉 fragment(#...)
      7. 去掉 userinfo(user:pass@ 前缀)
      8. 解析 dot-segment(/a/../b → /b)
      9. 归一化 percent-encoding(%7E → ~)
     10. 折叠多斜杠(//foo → /foo)
     11. query 参数排序

    8~10 交给 url-normalize 库;5、6、7、11 库不做(实测:库会保留尾斜杠、fragment 与
    参数顺序,也不会剥 userinfo),所以这几条在这里补。写入端落库前必须调一次:
    导出端直接取库里那一列,不会再归一化第二遍。
    """
    url = raw_url.strip()
    if not url:
        return ""

    try:
        parsed = urlsplit(url)
        host = (parsed.hostname or "").lower()
        port = parsed.port
    except ValueError:
        raise InvalidURLError(f"Invalid URL: {raw_url}") from None

    if "://" in url and not host:
        raise InvalidURLError(f"Invalid URL: {raw_url}")

    # 写入端(_check_url)已经拦了 scheme, 但函数自身不该依赖调用方先校验:
    # 任何新的调用方漏了那一步, 畸形输入就会被静默改写成另一个地址。
    if parsed.scheme and parsed.scheme.lower() not in _ALLOWED_SCHEMES:
        raise InvalidURLError(f"Unsupported URL scheme: {parsed.scheme!r}")

    if host.startswith("www."):
        host = host[4:]
    scheme = "http" if host in LOCAL_HOSTS else "https"

    netloc = f"[{host}]" if ":" in host else host
    if port is not None and port != _DEFAULT_PORTS.get(parsed.scheme.lower()):
        netloc = f"{netloc}:{port}"

    clean = urlunsplit((scheme, netloc, parsed.path or "/", parsed.query, ""))
    try:
        normalized = url_normalize(clean)
    except ValueError:
        raise InvalidURLError(f"Invalid URL: {raw_url}") from None

    # url_normalize 的声明是 str | None(它只在入参为 None 时回 None)。我们的入参必然
    # 非空, 但类型上必须收口: 不挡的话 urlsplit(None) 抛的是 TypeError, 会漏成 500。
    if not normalized:
        raise InvalidURLError(f"Invalid URL: {raw_url}")

    # 刻意不复用上面的 scheme / netloc: 那几个来自我们自己拼的串, 这里来自
    # url_normalize 的返回值。名字分开, 类型推断和阅读都不用再回头对上下文。
    norm_scheme, norm_netloc, norm_path, norm_query, _ = urlsplit(normalized)

    norm_path = "/" if norm_path in ("", "/") else norm_path.rstrip("/")
    norm_query = "&".join(sorted(norm_query.split("&"))) if norm_query else ""

    return urlunsplit((norm_scheme, norm_netloc, norm_path, norm_query, ""))


def url_hash_normalized(normalized_url: str) -> str:
    """对【已归一化】的 URL 串算 SHA-256 —— 写入端的推荐入口。

    调用方先调一次 normalize_url(),把结果同时写进 xg_tool_link.url 与这里:
    两个落库值出自同一次归一化,唯一键(uk_tl_url)和导出值才不可能各说各话。
    """
    return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()


def url_hash(raw_url: str) -> str:
    """归一化后再算 hash 的便利函数(入参是原始 URL)。

    内部会自己调一次 normalize_url —— 已经归一化过的调用方请直接用
    url_hash_normalized(),否则同一个 URL 要归一化两遍(纯浪费,且两次之间若有
    非幂等差异就会让 url 与 url_hash 对不上)。
    """
    return url_hash_normalized(normalize_url(raw_url))
