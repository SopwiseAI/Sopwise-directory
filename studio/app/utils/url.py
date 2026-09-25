import hashlib
from urllib.parse import urlsplit, urlunsplit

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "0.0.0.0"})  # noqa: S104


def normalize_url(raw_url: str) -> str:
    url = raw_url.strip()
    if not url:
        return ""

    parsed = urlsplit(url)

    host = parsed.hostname or ""
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]

    port = parsed.port
    if port and port not in (80, 443):
        host = f"{host}:{port}"

    scheme = "http" if host in _LOCAL_HOSTS else "https"

    path = parsed.path.rstrip("/") or ""
    query = parsed.query
    fragment = ""

    return urlunsplit((scheme, host, path, query, fragment))


def url_hash(raw_url: str) -> str:
    normalized = normalize_url(raw_url)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
