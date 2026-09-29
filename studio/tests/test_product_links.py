"""产品链接 CRUD + is_primary 唯一性 + URL 归一化去重 完整测试。"""

import pytest

from tests.conftest import create_link, create_product


@pytest.mark.asyncio
async def test_add_link(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://example.com", label="主站")
    assert link["url"] == "https://example.com"
    assert link["label"] == "主站"
    assert "id" in link
    assert link["product_id"] == product["id"]
    assert link["status"] == 1
    assert link["last_checked_at"] is None


@pytest.mark.asyncio
async def test_add_primary_link(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://example.com", is_primary=True)
    assert link["is_primary"] is True


@pytest.mark.asyncio
async def test_second_primary_link_rejected(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    await create_link(async_client, product["id"], url="https://a.com", is_primary=True)
    resp = await async_client.post(
        f"/api/v1/products/{product['id']}/links",
        json={"url": "https://b.com", "is_primary": True},
    )
    assert resp.status_code == 409
    assert "primary" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_url_normalization_dedup(async_client):
    """http://www.example.com 与 https://example.com 应判为同一 URL。"""
    product = await create_product(async_client, slug="p1", name="P1")
    await create_link(async_client, product["id"], url="https://example.com")
    resp = await async_client.post(
        f"/api/v1/products/{product['id']}/links",
        json={"url": "http://www.example.com/"},
    )
    assert resp.status_code == 409
    assert "URL already exists" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_url_dedup_cross_products(async_client):
    """同一 URL 可以挂到不同产品上（url_hash 为产品内唯一）。"""
    p1 = await create_product(async_client, slug="p1", name="P1")
    p2 = await create_product(async_client, slug="p2", name="P2")
    await create_link(async_client, p1["id"], url="https://shared.com")
    resp = await async_client.post(
        f"/api/v1/products/{p2['id']}/links",
        json={"url": "https://shared.com"},
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_list_product_links(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    await create_link(async_client, product["id"], url="https://a.com", label="A", is_primary=True)
    await create_link(async_client, product["id"], url="https://b.com", label="B")
    resp = await async_client.get(f"/api/v1/products/{product['id']}/links")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_update_link(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://old.com", label="旧")
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/links/{link['id']}",
        json={"label": "新标签", "url": "https://new.com"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["label"] == "新标签"
    assert data["url"] == "https://new.com"


@pytest.mark.asyncio
async def test_update_link_to_primary(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    await create_link(async_client, product["id"], url="https://a.com", is_primary=True)
    link2 = await create_link(async_client, product["id"], url="https://b.com", is_primary=False)
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/links/{link2['id']}",
        json={"is_primary": True},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_delete_link(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://del.com")
    resp = await async_client.delete(f"/api/v1/products/{product['id']}/links/{link['id']}")
    assert resp.status_code == 204
    resp = await async_client.get(f"/api/v1/products/{product['id']}/links")
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_add_link_to_nonexistent_product(async_client):
    resp = await async_client.post(
        "/api/v1/products/99999/links",
        json={"url": "https://example.com"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_link_status(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://example.com")
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/links/{link['id']}",
        json={"status": 2},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == 2


@pytest.mark.asyncio
async def test_list_links_filter_by_status(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    await create_link(async_client, product["id"], url="https://a.com")
    await create_link(async_client, product["id"], url="https://b.com", is_primary=True)
    resp = await async_client.get(f"/api/v1/products/{product['id']}/links?status=1")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_export_skips_broken_primary_link(async_client):
    """导出时主链接失效 → 回退到第一个正常链接。"""
    from tests.conftest import create_category

    cat = await create_category(async_client, slug="cat", name="分类")
    product = await create_product(
        async_client,
        slug="broken-primary",
        name="失效主链接产品",
        category_ids=[cat["id"]],
        status=2,
        links=[
            {"url": "https://secondary.com", "is_primary": False},
            {"url": "https://primary.com", "is_primary": True},
        ],
    )

    primary_link = next(lnk for lnk in product["links"] if lnk["is_primary"])
    await async_client.put(
        f"/api/v1/products/{product['id']}/links/{primary_link['id']}",
        json={"status": 2},
    )

    import json
    import os
    import tempfile
    from pathlib import Path
    from unittest.mock import patch

    with tempfile.TemporaryDirectory() as tmpdir:
        output = Path(os.path.join(tmpdir, "data-dev.json"))
        with patch("app.exporters.json_exporter.get_settings") as mock:
            settings = mock.return_value
            settings.export_full_path = output
            settings.app_env = "dev"
            resp = await async_client.post("/api/v1/export")

        assert resp.status_code == 200

        with open(output, encoding="utf-8") as f:
            exported = json.load(f)
        prod = exported["products"][0]
        assert prod["url"] == "https://secondary.com"


@pytest.mark.asyncio
async def test_update_link_ignores_explicit_null(async_client):
    """显式传 null 的非空字段应视为未提供, 不应触发 409/500。"""
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://keep.com", label="保留")

    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/links/{link['id']}",
        json={"url": None, "is_primary": None, "status": None, "sort_order": None},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["url"] == "https://keep.com"
    assert data["label"] == "保留"
    assert data["status"] == 1


@pytest.mark.asyncio
async def test_update_link_can_clear_label(async_client):
    """label 为可空字段, 显式 null 应能清空。"""
    product = await create_product(async_client, slug="p1", name="P1")
    link = await create_link(async_client, product["id"], url="https://x.com", label="标签")
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/links/{link['id']}",
        json={"label": None},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["label"] is None
