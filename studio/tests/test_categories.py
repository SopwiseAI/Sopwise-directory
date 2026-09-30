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
    await create_product(async_client, slug="prod-1", name="产品1", category_ids=[cat["id"]])
    resp = await async_client.delete(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 409
    assert "products" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_category_product_count(async_client):
    cat = await create_category(async_client, slug="count-cat", name="计数")
    await create_product(async_client, slug="p1", name="P1", category_ids=[cat["id"]], status=2)
    await create_product(async_client, slug="p2", name="P2", category_ids=[cat["id"]], status=2)
    await create_product(async_client, slug="p3", name="P3", category_ids=[cat["id"]], status=1)
    resp = await async_client.get(f"/api/v1/categories/{cat['id']}/count")
    assert resp.status_code == 200
    data = resp.json()
    assert data["product_count"] == 2


@pytest.mark.asyncio
async def test_category_response_product_count_only_published(async_client):
    """CategoryResponse.product_count 仅统计已发布产品，与 /count 端点一致。"""
    cat = await create_category(async_client, slug="pub-cat", name="发布计数")
    await create_product(async_client, slug="pub1", name="已发布1", category_ids=[cat["id"]], status=2)
    await create_product(async_client, slug="pub2", name="已发布2", category_ids=[cat["id"]], status=2)
    await create_product(async_client, slug="draft1", name="草稿1", category_ids=[cat["id"]], status=0)

    resp = await async_client.get(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 200
    assert resp.json()["product_count"] == 2

    resp = await async_client.get("/api/v1/categories")
    data = resp.json()
    assert data[0]["product_count"] == 2


@pytest.mark.asyncio
async def test_update_category_ignores_explicit_null(async_client):
    """显式传 null 的非空字段应视为未提供, 不应触发 409/500。"""
    cat = await create_category(async_client, slug="null-cat", name="空值", icon="Bot", status=1)
    resp = await async_client.put(
        f"/api/v1/categories/{cat['id']}",
        json={"slug": None, "name": None, "sort_order": None, "status": None},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["slug"] == "null-cat"
    assert data["name"] == "空值"
    assert data["status"] == 1


@pytest.mark.asyncio
async def test_delete_category_guard_counts_all_statuses(async_client):
    """删除守卫需拦截所有状态的产品(含草稿), 提示语应给出总数以免与 product_count 混淆。"""
    cat = await create_category(async_client, slug="mix-cat", name="混合")
    await create_product(async_client, slug="m-pub", name="已发布", category_ids=[cat["id"]], status=2)
    await create_product(async_client, slug="m-draft", name="草稿", category_ids=[cat["id"]], status=0)

    resp = await async_client.get(f"/api/v1/categories/{cat['id']}/count")
    assert resp.json()["product_count"] == 1

    resp = await async_client.delete(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 409
    detail = resp.json()["detail"]
    assert "2 products" in detail
    assert "unpublished" in detail


@pytest.mark.asyncio
async def test_category_count_not_found(async_client):
    """不存在的分类取计数应 404, 与详情端点语义一致。"""
    resp = await async_client.get("/api/v1/categories/99999/count")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_category_count_declares_response_model(async_client):
    """/count 应声明 response_model, 以便生成 OpenAPI schema。"""
    resp = await async_client.get("/openapi.json")
    assert "CategoryCountResponse" in resp.json()["components"]["schemas"]


@pytest.mark.asyncio
async def test_list_categories_rejects_out_of_range_status(async_client):
    """status 仅允许 0/1, 越界应 422 而非静默返回空列表。"""
    resp = await async_client.get("/api/v1/categories?status=5")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_category_can_clear_icon(async_client):
    """icon 为可空字段, 显式 null 应能清空。"""
    cat = await create_category(async_client, slug="icon-cat", name="图标", icon="Bot")
    resp = await async_client.put(f"/api/v1/categories/{cat['id']}", json={"icon": None})
    assert resp.status_code == 200, resp.text
    assert resp.json()["icon"] is None
