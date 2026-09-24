"""分类 CRUD 完整测试。"""

import pytest

from tests.conftest import create_category, create_product


@pytest.mark.asyncio
async def test_create_category(async_client):
    resp = await async_client.post(
        "/api/v1/categories",
        json={"slug": "chat-assistant", "name": "对话助手", "icon": "MessageSquare", "sort_order": 100},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["slug"] == "chat-assistant"
    assert data["name"] == "对话助手"
    assert data["icon"] == "MessageSquare"
    assert data["sort_order"] == 100
    assert data["status"] == 1
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_category_duplicate_slug(async_client):
    await create_category(async_client, slug="chat", name="对话")
    resp = await async_client.post(
        "/api/v1/categories",
        json={"slug": "chat", "name": "其他", "icon": "Bot"},
    )
    assert resp.status_code == 409
    assert "Slug already exists" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_create_category_duplicate_name(async_client):
    await create_category(async_client, slug="cat-a", name="重复名")
    resp = await async_client.post(
        "/api/v1/categories",
        json={"slug": "cat-b", "name": "重复名", "icon": "Bot"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_categories_sorted_by_sort_order(async_client):
    await create_category(async_client, slug="cat-a", name="A", sort_order=10)
    await create_category(async_client, slug="cat-b", name="B", sort_order=100)
    await create_category(async_client, slug="cat-c", name="C", sort_order=50)
    resp = await async_client.get("/api/v1/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    assert data[0]["name"] == "B"
    assert data[1]["name"] == "C"
    assert data[2]["name"] == "A"


@pytest.mark.asyncio
async def test_list_categories_filter_by_status(async_client):
    await create_category(async_client, slug="cat-on", name="启用", status=1)
    await create_category(async_client, slug="cat-off", name="禁用", status=0)
    resp = await async_client.get("/api/v1/categories?status=1")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "启用"


@pytest.mark.asyncio
async def test_get_category_by_id(async_client):
    cat = await create_category(async_client, slug="cat-1", name="分类1")
    resp = await async_client.get(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "分类1"


@pytest.mark.asyncio
async def test_get_category_not_found(async_client):
    resp = await async_client.get("/api/v1/categories/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_category(async_client):
    cat = await create_category(async_client, slug="old-slug", name="旧名")
    resp = await async_client.put(
        f"/api/v1/categories/{cat['id']}",
        json={"name": "新名", "sort_order": 200},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "新名"
    assert data["sort_order"] == 200
    assert data["slug"] == "old-slug"


@pytest.mark.asyncio
async def test_update_category_slug_conflict(async_client):
    await create_category(async_client, slug="slug-a", name="A")
    cat_b = await create_category(async_client, slug="slug-b", name="B")
    resp = await async_client.put(
        f"/api/v1/categories/{cat_b['id']}",
        json={"slug": "slug-a"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_delete_category_empty(async_client):
    cat = await create_category(async_client, slug="del-me", name="待删除")
    resp = await async_client.delete(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_category_with_products_rejected(async_client):
    cat = await create_category(async_client, slug="has-prod", name="有产品")
    await create_product(async_client, slug="prod-1", name="产品1", category_id=cat["id"])
    resp = await async_client.delete(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 409
    assert "products" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_category_product_count(async_client):
    cat = await create_category(async_client, slug="count-cat", name="计数")
    await create_product(async_client, slug="p1", name="P1", category_id=cat["id"], status=1)
    await create_product(async_client, slug="p2", name="P2", category_id=cat["id"], status=1)
    await create_product(async_client, slug="p3", name="P3", category_id=cat["id"], status=0)
    resp = await async_client.get(f"/api/v1/categories/{cat['id']}/count")
    assert resp.status_code == 200
    data = resp.json()
    assert data["product_count"] == 2
