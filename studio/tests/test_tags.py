"""标签 CRUD 完整测试。"""

import pytest

from tests.conftest import create_tag


@pytest.mark.asyncio
async def test_create_tag(async_client):
    resp = await async_client.post("/api/v1/tags", json={"slug": "free", "name": "免费"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["slug"] == "free"
    assert data["name"] == "免费"
    assert "id" in data
    assert data["sort_order"] == 0
    assert data["status"] == 1
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_tag_duplicate_slug(async_client):
    await create_tag(async_client, slug="free", name="免费")
    resp = await async_client.post("/api/v1/tags", json={"slug": "free", "name": "免费2"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_tag_duplicate_name(async_client):
    await create_tag(async_client, slug="tag-a", name="重复")
    resp = await async_client.post("/api/v1/tags", json={"slug": "tag-b", "name": "重复"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_tags_sorted_by_sort_order(async_client):
    await create_tag(async_client, slug="t-a", name="Alpha", sort_order=1)
    await create_tag(async_client, slug="t-b", name="Bravo", sort_order=5)
    await create_tag(async_client, slug="t-c", name="Charlie", sort_order=5)
    resp = await async_client.get("/api/v1/tags")
    data = resp.json()
    assert len(data) == 3
    # sort_order 降序；相同 sort_order 按 id 升序
    assert data[0]["name"] == "Bravo"
    assert data[1]["name"] == "Charlie"
    assert data[2]["name"] == "Alpha"


@pytest.mark.asyncio
async def test_list_tags_filter_by_status(async_client):
    await create_tag(async_client, slug="t-on", name="启用", status=1)
    await create_tag(async_client, slug="t-off", name="禁用", status=0)
    resp = await async_client.get("/api/v1/tags", params={"status": 1})
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "启用"


@pytest.mark.asyncio
async def test_get_tag_by_id(async_client):
    tag = await create_tag(async_client, slug="api", name="API")
    resp = await async_client.get(f"/api/v1/tags/{tag['id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "API"


@pytest.mark.asyncio
async def test_get_tag_not_found(async_client):
    resp = await async_client.get("/api/v1/tags/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_tag(async_client):
    tag = await create_tag(async_client, slug="old", name="旧名")
    resp = await async_client.put(f"/api/v1/tags/{tag['id']}", json={"name": "新名"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "新名"


@pytest.mark.asyncio
async def test_update_tag_sort_order_and_status(async_client):
    tag = await create_tag(async_client, slug="ord", name="排序")
    resp = await async_client.put(f"/api/v1/tags/{tag['id']}", json={"sort_order": 10, "status": 0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["sort_order"] == 10
    assert data["status"] == 0


@pytest.mark.asyncio
async def test_delete_tag(async_client):
    tag = await create_tag(async_client, slug="del", name="待删")
    resp = await async_client.delete(f"/api/v1/tags/{tag['id']}")
    assert resp.status_code == 204
    resp = await async_client.get(f"/api/v1/tags/{tag['id']}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tag_product_count(async_client):
    from tests.conftest import create_product

    tag = await create_tag(async_client, slug="t1", name="T1")
    await create_product(async_client, slug="p1", name="P1", tag_ids=[tag["id"]])
    await create_product(async_client, slug="p2", name="P2", tag_ids=[tag["id"]])
    resp = await async_client.get(f"/api/v1/tags/{tag['id']}/count")
    assert resp.status_code == 200
    assert resp.json()["product_count"] == 2
