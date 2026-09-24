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
    """同一 URL 不能挂到两个不同产品上。"""
    p1 = await create_product(async_client, slug="p1", name="P1")
    p2 = await create_product(async_client, slug="p2", name="P2")
    await create_link(async_client, p1["id"], url="https://shared.com")
    resp = await async_client.post(
        f"/api/v1/products/{p2['id']}/links",
        json={"url": "https://shared.com"},
    )
    assert resp.status_code == 409


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
