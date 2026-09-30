"""产品关联 CRUD 完整测试。"""

import pytest

from tests.conftest import create_product


@pytest.mark.asyncio
async def test_create_relation(async_client):
    a = await create_product(async_client, slug="rel-a", name="产品A")
    b = await create_product(async_client, slug="rel-b", name="产品B")
    resp = await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": b["id"], "relation_type": "similar"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["product_id"] == a["id"]
    assert data["related_id"] == b["id"]
    assert data["relation_type"] == "similar"
    assert data["related_slug"] == "rel-b"
    assert data["related_name"] == "产品B"


@pytest.mark.asyncio
async def test_create_relation_rejects_self(async_client):
    a = await create_product(async_client, slug="self-a", name="自身")
    resp = await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": a["id"], "relation_type": "similar"},
    )
    assert resp.status_code == 400
    assert "自身" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_create_relation_source_not_found(async_client):
    b = await create_product(async_client, slug="rel-src", name="关联源")
    resp = await async_client.post(
        "/api/v1/products/99999/relations",
        json={"related_id": b["id"], "relation_type": "similar"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_relation_related_not_found(async_client):
    a = await create_product(async_client, slug="rel-rel", name="关联目标")
    resp = await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": 99999, "relation_type": "similar"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_relation_duplicate_conflict(async_client):
    a = await create_product(async_client, slug="dup-a", name="重复A")
    b = await create_product(async_client, slug="dup-b", name="重复B")
    payload = {"related_id": b["id"], "relation_type": "similar"}
    resp = await async_client.post(f"/api/v1/products/{a['id']}/relations", json=payload)
    assert resp.status_code == 201
    resp = await async_client.post(f"/api/v1/products/{a['id']}/relations", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_relations(async_client):
    a = await create_product(async_client, slug="list-a", name="列表A")
    b = await create_product(async_client, slug="list-b", name="列表B")
    await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": b["id"], "relation_type": "upgrade"},
    )
    resp = await async_client.get(f"/api/v1/products/{a['id']}/relations")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["related_slug"] == "list-b"
    assert data[0]["relation_type"] == "upgrade"


@pytest.mark.asyncio
async def test_list_relations_filter_by_type(async_client):
    a = await create_product(async_client, slug="filter-a", name="筛选A")
    b = await create_product(async_client, slug="filter-b", name="筛选B")
    c = await create_product(async_client, slug="filter-c", name="筛选C")
    await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": b["id"], "relation_type": "similar"},
    )
    await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": c["id"], "relation_type": "alternative"},
    )
    resp = await async_client.get(f"/api/v1/products/{a['id']}/relations?type=similar")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["related_id"] == b["id"]


@pytest.mark.asyncio
async def test_list_relations_nonexistent_source_returns_empty(async_client):
    """源产品不存在时返回空列表（与 links 端点级联约定一致）。"""
    resp = await async_client.get("/api/v1/products/99999/relations")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_update_relation_type(async_client):
    a = await create_product(async_client, slug="upd-a", name="更新A")
    b = await create_product(async_client, slug="upd-b", name="更新B")
    rel = (
        await async_client.post(
            f"/api/v1/products/{a['id']}/relations",
            json={"related_id": b["id"], "relation_type": "similar"},
        )
    ).json()
    resp = await async_client.put(
        f"/api/v1/products/{a['id']}/relations/{rel['id']}",
        json={"relation_type": "complementary"},
    )
    assert resp.status_code == 200
    assert resp.json()["relation_type"] == "complementary"


@pytest.mark.asyncio
async def test_update_relation_type_conflict(async_client):
    a = await create_product(async_client, slug="conf-a", name="冲突A")
    b = await create_product(async_client, slug="conf-b", name="冲突B")
    rel1 = (
        await async_client.post(
            f"/api/v1/products/{a['id']}/relations",
            json={"related_id": b["id"], "relation_type": "similar"},
        )
    ).json()
    await async_client.post(
        f"/api/v1/products/{a['id']}/relations",
        json={"related_id": b["id"], "relation_type": "alternative"},
    )
    resp = await async_client.put(
        f"/api/v1/products/{a['id']}/relations/{rel1['id']}",
        json={"relation_type": "alternative"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_relation_not_found(async_client):
    a = await create_product(async_client, slug="nf-a", name="未找到")
    resp = await async_client.put(
        f"/api/v1/products/{a['id']}/relations/99999",
        json={"relation_type": "similar"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_relation_rejects_invalid_type_filter(async_client):
    """type 仅允许 RelationType 枚举值, 非法/空串应 422。"""
    a = await create_product(async_client, slug="badtype-a", name="非法类型")
    resp = await async_client.get(f"/api/v1/products/{a['id']}/relations?type=bogus")
    assert resp.status_code == 422
    resp = await async_client.get(f"/api/v1/products/{a['id']}/relations?type=")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_relation_ignores_explicit_null(async_client):
    """显式传 null 的非空字段应视为未提供, 不应触发 409/500。"""
    a = await create_product(async_client, slug="null-a", name="空值A")
    b = await create_product(async_client, slug="null-b", name="空值B")
    rel = (
        await async_client.post(
            f"/api/v1/products/{a['id']}/relations",
            json={"related_id": b["id"], "relation_type": "similar", "sort_order": 5},
        )
    ).json()
    resp = await async_client.put(
        f"/api/v1/products/{a['id']}/relations/{rel['id']}",
        json={"relation_type": None, "sort_order": None},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["relation_type"] == "similar"
    assert data["sort_order"] == 5


@pytest.mark.asyncio
async def test_delete_relation(async_client):
    a = await create_product(async_client, slug="del-a", name="删除A")
    b = await create_product(async_client, slug="del-b", name="删除B")
    rel = (
        await async_client.post(
            f"/api/v1/products/{a['id']}/relations",
            json={"related_id": b["id"], "relation_type": "similar"},
        )
    ).json()
    resp = await async_client.delete(f"/api/v1/products/{a['id']}/relations/{rel['id']}")
    assert resp.status_code == 204
    resp = await async_client.get(f"/api/v1/products/{a['id']}/relations")
    assert resp.json() == []


@pytest.mark.asyncio
async def test_relation_write_requires_auth(anon_client):
    resp = await anon_client.post("/api/v1/products/1000/relations", json={})
    assert resp.status_code == 401
