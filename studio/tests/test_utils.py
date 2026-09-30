"""utils 模块单元测试 -- normalize_url / url_hash / check_unique."""

import pytest
from fastapi import HTTPException

from app.core.database import AsyncSessionLocal
from app.models import Category
from app.utils.db import check_unique
from app.utils.url import InvalidURLError, normalize_url, url_hash
from tests.conftest import create_category

# -- normalize_url ---------------------------------------------------------------


class TestNormalizeUrl:
    """schema.sql 归一化规则: 小写域名 / 去 www / 去默认端口 / 去尾斜杠(根路径保留) / 去 fragment / query 排序."""

    def test_schema_doc_example(self):
        """schema 文档示例: http://www.Example.com:443/foo/#top -> https://example.com/foo"""
        assert normalize_url("http://www.Example.com:443/foo/#top") == "https://example.com/foo"

    def test_empty_string(self):
        assert normalize_url("") == ""

    def test_whitespace_only(self):
        assert normalize_url("   ") == ""

    def test_strips_whitespace(self):
        assert normalize_url("  https://example.com  ") == "https://example.com/"

    def test_lowercase_host(self):
        assert normalize_url("https://EXAMPLE.COM/") == "https://example.com/"
        assert normalize_url("https://ExAmple.COM/Path") == "https://example.com/Path"

    def test_strip_www(self):
        assert normalize_url("https://www.example.com/") == "https://example.com/"
        assert normalize_url("https://www.example.com/foo") == "https://example.com/foo"

    def test_strip_default_port_443(self):
        assert normalize_url("https://example.com:443/") == "https://example.com/"
        assert normalize_url("https://example.com:443/foo") == "https://example.com/foo"

    def test_strip_default_port_80(self):
        assert normalize_url("http://example.com:80/") == "https://example.com/"

    def test_keep_custom_port(self):
        assert normalize_url("https://example.com:8080/") == "https://example.com:8080/"
        assert normalize_url("http://example.com:3000/foo") == "https://example.com:3000/foo"

    def test_root_path_kept(self):
        """根路径 '/' 应保留 (schema: 根路径除外)."""
        assert normalize_url("https://example.com/") == "https://example.com/"
        assert normalize_url("https://example.com") == "https://example.com/"

    def test_trailing_slash_stripped(self):
        assert normalize_url("https://example.com/foo/") == "https://example.com/foo"
        assert normalize_url("https://example.com/foo/bar/") == "https://example.com/foo/bar"

    def test_fragment_removed(self):
        assert normalize_url("https://example.com/foo#section") == "https://example.com/foo"
        assert normalize_url("https://example.com/#top") == "https://example.com/"

    def test_query_order_normalized(self):
        """不同顺序的 query 参数应归一化到同一结果."""
        assert normalize_url("https://example.com?a=1&b=2") == normalize_url("https://example.com?b=2&a=1")

    def test_query_sorted_result(self):
        assert normalize_url("https://example.com?b=2&a=1") == "https://example.com/?a=1&b=2"

    def test_query_url_encoded_preserved(self):
        """URL-encoded 值不应被 decode."""
        assert normalize_url("https://example.com?q=hello%20world") == "https://example.com/?q=hello%20world"

    def test_localhost_scheme_http(self):
        assert normalize_url("http://localhost:3000/") == "http://localhost:3000/"
        assert normalize_url("http://localhost/") == "http://localhost/"

    def test_127_local_scheme_http(self):
        assert normalize_url("http://127.0.0.1:8000") == "http://127.0.0.1:8000/"

    def test_https_forced_for_non_local(self):
        """非本地主机强制 https."""
        assert normalize_url("http://example.com/") == "https://example.com/"

    def test_invalid_port_raises(self):
        with pytest.raises(InvalidURLError):
            normalize_url("https://example.com:abc/path")

    def test_invalid_port_negative_raises(self):
        with pytest.raises(InvalidURLError):
            normalize_url("https://example.com:-1/")

    def test_empty_host_with_authority_raises(self):
        """含 '://' 但主机为空时不得静默改写主机 (https:///evil.com -> https://evil.com/), 应报错."""
        for url in ("https:///evil.com", "https://", "https://user@/x", "http:///x.com"):
            with pytest.raises(InvalidURLError):
                normalize_url(url)

    def test_no_scheme(self):
        """无 scheme 的 URL 仍可解析 (hostname 提取)."""
        result = normalize_url("example.com/foo")
        assert "example.com" in result

    # -- url_normalize 库提供的能力 -------------------------------------------

    def test_dot_segment_resolved(self):
        """/a/../b -> /b, /a/./b -> /a/b."""
        assert normalize_url("https://example.com/a/../b") == "https://example.com/b"
        assert normalize_url("https://example.com/a/./b") == "https://example.com/a/b"

    def test_percent_encoding_unreserved_decoded(self):
        """非保留字符 decode: %7E -> ~."""
        assert normalize_url("https://example.com/%7e") == "https://example.com/~"
        assert normalize_url("https://example.com/%7E") == "https://example.com/~"
        assert normalize_url("https://example.com/foo%7E") == "https://example.com/foo~"

    def test_percent_encoding_consistency(self):
        """大小写不同的 percent-encoding 应归一化到同一结果."""
        assert url_hash("https://example.com/%7e") == url_hash("https://example.com/%7E")

    def test_ipv6_localhost(self):
        """IPv6 localhost 应使用 http."""
        assert normalize_url("http://[::1]:8000/") == "http://[::1]:8000/"

    def test_ipv6_remote(self):
        """IPv6 远程地址应使用 https."""
        assert normalize_url("https://[2001:db8::1]/path") == "https://[2001:db8::1]/path"

    def test_multi_slash_collapsed(self):
        """多斜杠折叠: //foo -> /foo."""
        assert normalize_url("https://example.com//foo") == "https://example.com/foo"
        assert normalize_url("https://example.com/foo//bar") == "https://example.com/foo/bar"

    def test_userinfo_stripped(self):
        """userinfo (user:pass@) 应被剥离."""
        assert normalize_url("https://user:pass@example.com/") == "https://example.com/"
        assert normalize_url("https://user@example.com/foo") == "https://example.com/foo"

    def test_userinfo_hash_consistency(self):
        """带不带 userinfo 应产生相同 hash."""
        assert url_hash("https://user:pass@example.com/") == url_hash("https://example.com/")

    def test_invalid_ipv6_raises(self):
        """非法 IPv6 地址应抛 InvalidURLError."""
        with pytest.raises(InvalidURLError):
            normalize_url("https://[::g]/")

    def test_error_message_generic(self):
        """异常消息不应透传 url_normalize 内部细节, 应为 'Invalid URL: ...'."""
        with pytest.raises(InvalidURLError) as exc_info:
            normalize_url("https://[::g]/")
        assert "Invalid URL:" in str(exc_info.value)
        assert "IPv4" not in str(exc_info.value)
        assert "IPv6" not in str(exc_info.value)

    def test_error_message_port_generic(self):
        """端口异常消息也应为 'Invalid URL: ...'."""
        with pytest.raises(InvalidURLError) as exc_info:
            normalize_url("https://example.com:abc/path")
        assert "Invalid URL:" in str(exc_info.value)
        assert "port" not in str(exc_info.value).lower()


# -- url_hash --------------------------------------------------------------------


class TestUrlHash:
    def test_deterministic(self):
        assert url_hash("https://example.com") == url_hash("https://example.com")

    def test_normalization_before_hash(self):
        """归一化后相同的 URL 应产生相同 hash."""
        assert url_hash("http://www.Example.com:443/foo/#top") == url_hash("https://example.com/foo")

    def test_root_path_consistency(self):
        assert url_hash("https://example.com/") == url_hash("https://example.com")

    def test_query_order_consistency(self):
        assert url_hash("https://example.com?a=1&b=2") == url_hash("https://example.com?b=2&a=1")

    def test_dot_segment_consistency(self):
        """dot-segment 解析后相同的 URL 应产生相同 hash."""
        assert url_hash("https://example.com/a/../b") == url_hash("https://example.com/b")

    def test_different_urls_different_hash(self):
        assert url_hash("https://example.com") != url_hash("https://example.org")

    def test_empty_string_hash(self):
        """空字符串不应抛异常."""
        h = url_hash("")
        assert isinstance(h, str) and len(h) == 64

    def test_hash_length(self):
        assert len(url_hash("https://example.com")) == 64

    def test_invalid_port_raises(self):
        with pytest.raises(InvalidURLError):
            url_hash("https://example.com:abc/path")

    def test_empty_host_raises(self):
        with pytest.raises(InvalidURLError):
            url_hash("https:///evil.com")


# -- check_unique ----------------------------------------------------------------


async def test_check_unique_available(async_client):
    """字段值不存在时不应抛异常."""
    async with AsyncSessionLocal() as session:
        await check_unique(session, Category, Category.slug, "unique-slug", label="Slug")


async def test_check_unique_conflict(async_client):
    """字段值已存在时应抛 409."""
    await create_category(async_client, slug="dup-slug", name="重复Slug")

    async with AsyncSessionLocal() as session:
        with pytest.raises(HTTPException) as exc_info:
            await check_unique(session, Category, Category.slug, "dup-slug", label="Slug")
        assert exc_info.value.status_code == 409
        assert "Slug already exists" in exc_info.value.detail


async def test_check_unique_exclude_id(async_client):
    """更新场景: exclude_id 应排除自身记录."""
    cat = await create_category(async_client, slug="keep-slug", name="保留Slug")

    async with AsyncSessionLocal() as session:
        await check_unique(session, Category, Category.slug, "keep-slug", exclude_id=cat["id"], label="Slug")


async def test_check_unique_exclude_id_still_conflicts(async_client):
    """更新场景: exclude_id 排除自身后, 与其他记录冲突仍应抛 409."""
    cat1 = await create_category(async_client, slug="slug-a", name="Slug A")
    await create_category(async_client, slug="slug-b", name="Slug B")

    async with AsyncSessionLocal() as session:
        with pytest.raises(HTTPException) as exc_info:
            await check_unique(session, Category, Category.slug, "slug-b", exclude_id=cat1["id"], label="Slug")
        assert exc_info.value.status_code == 409
