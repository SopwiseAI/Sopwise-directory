"""产品 CRUD + 发布逻辑 + 过滤 + 分页 完整测试。"""

import pytest

from tests.conftest import create_category, create_product, create_tag


@pytest.mark.asyncio
async def test_create_product_minimal(async_client):
    """只传 name 和 slug，其他全部默认。"""
    resp = await async_client.post(
        "/api/v1/products",
        json={"slug": "mini", "name": "最小产品"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "最小产品"
    assert data["pricing"] == "free"
    assert data["featured"] is False
    assert data["status"] == 0
    assert data["description"] is None
    assert data["category_id"] is None
    assert data["links"] == []
    assert data["tags"] == []


@pytest.mark.asyncio
async def test_create_product_with_links_and_tags(async_client):
    cat = await create_category(async_client, slug="cat", name="分类")
    tag1 = await create_tag(async_client, slug="t1", name="T1")
    tag2 = await create_tag(async_client, slug="t2", name="T2")
    data = await create_product(
        async_client,
        slug="full",
        name="完整产品",
        description="描述",
        category_id=cat["id"],
        pricing="paid",
        featured=True,
        links=[{"url": "https://example.com", "label": "主站", "is_primary": True}],
        tag_ids=[tag1["id"], tag2["id"]],
    )
    assert len(data["links"]) == 1
    assert data["links"][0]["url"] == "https://example.com"
    assert data["links"][0]["is_primary"] is True
    assert len(data["tags"]) == 2


@pytest.mark.asyncio
async def test_create_product_duplicate_slug(async_client):
    await create_product(async_client, slug="dup", name="A")
    resp = await async_client.post("/api/v1/products", json={"slug": "dup", "name": "B"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_product_duplicate_name(async_client):
    await create_product(async_client, slug="a", name="重复名")
    resp = await async_client.post("/api/v1/products", json={"slug": "b", "name": "重复名"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_publish_sets_published_at(async_client):
    """草稿产品发布时 published_at 从 null 变为时间。流程: 0→1→2。"""
    product = await create_product(async_client, slug="draft", name="草稿", status=0)
    assert product["published_at"] is None

    # 提交审核: 0→1
    resp = await async_client.put(f"/api/v1/products/{product['id']}", json={"status": 1})
    assert resp.status_code == 200
    assert resp.json()["published_at"] is None

    # 审核通过发布: 1→2
    resp = await async_client.put(f"/api/v1/products/{product['id']}", json={"status": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == 2
    assert data["published_at"] is not None


@pytest.mark.asyncio
async def test_publish_at_does_not_change_on_reupdate(async_client):
    """已发布产品再次更新，published_at 不变。"""
    product = await create_product(async_client, slug="pub", name="已发布", status=2)
    original = product["published_at"]

    resp = await async_client.put(f"/api/v1/products/{product['id']}", json={"description": "改描述"})
    assert resp.status_code == 200
    assert resp.json()["published_at"] == original


@pytest.mark.asyncio
async def test_filter_by_status(async_client):
    await create_product(async_client, slug="p1", name="P1", status=2)
    await create_product(async_client, slug="p2", name="P2", status=0)
    await create_product(async_client, slug="p3", name="P3", status=3)
    resp = await async_client.get("/api/v1/products?status=2")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "P1"


@pytest.mark.asyncio
async def test_filter_by_featured(async_client):
    await create_product(async_client, slug="p1", name="P1", featured=True)
    await create_product(async_client, slug="p2", name="P2", featured=False)
    resp = await async_client.get("/api/v1/products?featured=true")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["featured"] is True


@pytest.mark.asyncio
async def test_filter_by_category(async_client):
    cat = await create_category(async_client, slug="cat", name="分类")
    await create_product(async_client, slug="p1", name="P1", category_id=cat["id"])
    await create_product(async_client, slug="p2", name="P2")
    resp = await async_client.get(f"/api/v1/products?category_id={cat['id']}")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "P1"


@pytest.mark.asyncio
async def test_pagination(async_client):
    for i in range(5):
        await create_product(async_client, slug=f"p{i}", name=f"P{i}")
    resp = await async_client.get("/api/v1/products?page=1&page_size=2")
    assert len(resp.json()) == 2
    resp = await async_client.get("/api/v1/products?page=2&page_size=2")
    assert len(resp.json()) == 2
    resp = await async_client.get("/api/v1/products?page=3&page_size=2")
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_get_product_by_id(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "P1"


@pytest.mark.asyncio
async def test_get_product_not_found(async_client):
    resp = await async_client.get("/api/v1/products/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_product(async_client):
    product = await create_product(async_client, slug="p1", name="旧名")
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}",
        json={"name": "新名", "pricing": "paid"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "新名"
    assert data["pricing"] == "paid"


@pytest.mark.asyncio
async def test_delete_product(async_client):
    product = await create_product(async_client, slug="del", name="待删")
    resp = await async_client.delete(f"/api/v1/products/{product['id']}")
    assert resp.status_code == 204
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    assert resp.status_code == 404
