import hashlib
from urllib.parse import urlsplit, urlunsplit


def normalize_url(raw_url: str) -> str:
    url = raw_url.strip()
    if not url:
        return ""

    parsed = urlsplit(url)

    scheme = "https"

    netloc = parsed.hostname or ""
    netloc = netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]

    port = parsed.port
    if port and port not in (80, 443):
        netloc = f"{netloc}:{port}"

    path = parsed.path.rstrip("/") or ""

    query = parsed.query

    fragment = ""

    return urlunsplit((scheme, netloc, path, query, fragment))


def url_hash(raw_url: str) -> str:
    normalized = normalize_url(raw_url)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
