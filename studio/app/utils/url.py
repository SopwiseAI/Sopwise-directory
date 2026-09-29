import hashlib
from urllib.parse import urlsplit, urlunsplit

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "0.0.0.0"})


class InvalidURLError(ValueError):
    """URL 格式非法(如端口非数字), 调用方应返回 400."""


def normalize_url(raw_url: str) -> str:
    url = raw_url.strip()
    if not url:
        return ""

    parsed = urlsplit(url)

    host = parsed.hostname or ""
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]

    try:
        port = parsed.port
    except ValueError:
        raise InvalidURLError(f"Invalid port in URL: {raw_url}") from None

    scheme = "http" if host in _LOCAL_HOSTS else "https"

    if port and port not in (80, 443):
        host = f"{host}:{port}"

    path = "/" if parsed.path == "/" or not parsed.path else parsed.path.rstrip("/")

    if parsed.query:
        pairs = parsed.query.split("&")
        query = "&".join(sorted(pairs))
    else:
        query = ""

    fragment = ""

    return urlunsplit((scheme, host, path, query, fragment))


def url_hash(raw_url: str) -> str:
    normalized = normalize_url(raw_url)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
