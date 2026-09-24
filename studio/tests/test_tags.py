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
async def test_list_tags_sorted_by_name(async_client):
    await create_tag(async_client, slug="t-c", name="Charlie")
    await create_tag(async_client, slug="t-a", name="Alpha")
    await create_tag(async_client, slug="t-b", name="Bravo")
    resp = await async_client.get("/api/v1/tags")
    data = resp.json()
    assert len(data) == 3
    assert data[0]["name"] == "Alpha"
    assert data[1]["name"] == "Bravo"
    assert data[2]["name"] == "Charlie"


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
