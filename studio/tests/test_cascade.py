"""级联删除测试 — 验证外键 ON DELETE CASCADE / SET NULL 行为。"""

from tests.conftest import create_category, create_link, create_product, create_tag


async def test_delete_product_cascades_links(async_client):
    """删除产品 → 链接自动级联删除。"""
    product = await create_product(async_client, slug="p1", name="P1")
    await create_link(async_client, product["id"], url="https://a.com")
    await create_link(async_client, product["id"], url="https://b.com")

    await async_client.delete(f"/api/v1/products/{product['id']}")

    # 产品本身已删除
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    assert resp.status_code == 404

    # 链接已级联删除 — list 端点返回空列表
    resp = await async_client.get(f"/api/v1/products/{product['id']}/links")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


async def test_delete_product_cascades_tag_associations(async_client):
    """删除产品 → 标签关联自动级联删除，但标签本身仍在。"""
    tag = await create_tag(async_client, slug="t1", name="T1")
    product = await create_product(async_client, slug="p1", name="P1", tag_ids=[tag["id"]])

    await async_client.delete(f"/api/v1/products/{product['id']}")

    # 标签应仍存在
    resp = await async_client.get(f"/api/v1/tags/{tag['id']}")
    assert resp.status_code == 200

    # 标签的产品计数应为 0
    resp = await async_client.get(f"/api/v1/tags/{tag['id']}/count")
    assert resp.json()["product_count"] == 0


async def test_delete_tag_cascades_associations(async_client):
    """删除标签 → 产品-标签关联自动级联删除，但产品本身仍在。"""
    tag = await create_tag(async_client, slug="t1", name="T1")
    product = await create_product(async_client, slug="p1", name="P1", tag_ids=[tag["id"]])

    await async_client.delete(f"/api/v1/tags/{tag['id']}")

    # 产品应仍存在
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    assert resp.status_code == 200
    assert len(resp.json()["tags"]) == 0


async def test_delete_category_cascades_associations(async_client):
    """删除分类 → 产品-分类关联自动级联删除，但产品本身仍在。

    N:M 关系下，分类有产品关联时不允许删除（先解除关联）。
    这里测试先解除关联再删除分类。
    """
    cat = await create_category(async_client, slug="cat", name="分类")
    product = await create_product(async_client, slug="p1", name="P1", category_ids=[cat["id"]])

    # 先解除产品的分类关联
    await async_client.put(f"/api/v1/products/{product['id']}", json={"category_ids": []})

    # 现在可以删除分类
    resp = await async_client.delete(f"/api/v1/categories/{cat['id']}")
    assert resp.status_code == 204

    # 产品仍在，分类列表为空
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    assert resp.status_code == 200
    assert resp.json()["categories"] == []
