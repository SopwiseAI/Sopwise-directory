"""产品-标签关联 完整测试。"""

import pytest

from tests.conftest import create_product, create_tag


@pytest.mark.asyncio
async def test_set_product_tags(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    tag1 = await create_tag(async_client, slug="t1", name="T1")
    tag2 = await create_tag(async_client, slug="t2", name="T2")
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/tags",
        json={"tag_ids": [tag1["id"], tag2["id"]]},
    )
    assert resp.status_code == 200
    assert resp.json()["tag_ids"] == [tag1["id"], tag2["id"]]

    # 验证产品详情中包含标签
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    tags = resp.json()["tags"]
    assert len(tags) == 2
    tag_names = {t["name"] for t in tags}
    assert tag_names == {"T1", "T2"}


@pytest.mark.asyncio
async def test_update_product_tags_replace(async_client):
    """更新标签应完全替换，而非追加。"""
    product = await create_product(async_client, slug="p1", name="P1")
    tag1 = await create_tag(async_client, slug="t1", name="T1")
    tag2 = await create_tag(async_client, slug="t2", name="T2")
    tag3 = await create_tag(async_client, slug="t3", name="T3")

    await async_client.put(
        f"/api/v1/products/{product['id']}/tags",
        json={"tag_ids": [tag1["id"], tag2["id"]]},
    )
    await async_client.put(
        f"/api/v1/products/{product['id']}/tags",
        json={"tag_ids": [tag3["id"]]},
    )
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    tags = resp.json()["tags"]
    assert len(tags) == 1
    assert tags[0]["name"] == "T3"


@pytest.mark.asyncio
async def test_clear_product_tags(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    tag1 = await create_tag(async_client, slug="t1", name="T1")
    await async_client.put(
        f"/api/v1/products/{product['id']}/tags",
        json={"tag_ids": [tag1["id"]]},
    )
    await async_client.put(
        f"/api/v1/products/{product['id']}/tags",
        json={"tag_ids": []},
    )
    resp = await async_client.get(f"/api/v1/products/{product['id']}")
    assert len(resp.json()["tags"]) == 0


@pytest.mark.asyncio
async def test_set_tags_with_invalid_id(async_client):
    product = await create_product(async_client, slug="p1", name="P1")
    tag = await create_tag(async_client, slug="t1", name="T1")
    resp = await async_client.put(
        f"/api/v1/products/{product['id']}/tags",
        json={"tag_ids": [tag["id"], 99999]},
    )
    assert resp.status_code == 400
    assert "99999" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_set_tags_nonexistent_product(async_client):
    tag = await create_tag(async_client, slug="t1", name="T1")
    resp = await async_client.put(
        "/api/v1/products/99999/tags",
        json={"tag_ids": [tag["id"]]},
    )
    assert resp.status_code == 404
