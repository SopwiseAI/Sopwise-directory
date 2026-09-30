import hashlib
from urllib.parse import urlsplit, urlunsplit

from url_normalize import url_normalize

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "0.0.0.0"})
_DEFAULT_PORTS = frozenset({80, 443})


class InvalidURLError(ValueError):
    """URL 格式非法(如端口非数字), 调用方应返回 400."""


def normalize_url(raw_url: str) -> str:
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

    if host.startswith("www."):
        host = host[4:]
    scheme = "http" if host in _LOCAL_HOSTS else "https"

    netloc = f"[{host}]" if ":" in host else host
    if port and port not in _DEFAULT_PORTS:
        netloc = f"{netloc}:{port}"

    clean = urlunsplit((scheme, netloc, parsed.path or "/", parsed.query, ""))
    try:
        normalized = url_normalize(clean)
    except ValueError:
        raise InvalidURLError(f"Invalid URL: {raw_url}") from None

    scheme, netloc, path, query, _ = urlsplit(normalized)

    path = "/" if path == "/" or not path else path.rstrip("/")
    query = "&".join(sorted(query.split("&"))) if query else ""

    return urlunsplit((scheme, netloc, path, query, ""))


def url_hash(raw_url: str) -> str:
    normalized = normalize_url(raw_url)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
