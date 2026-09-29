"""JSON 导出 鉴权 + 数据格式验证 完整测试。"""

import json
from unittest.mock import patch

import pytest

from tests.conftest import create_category, create_product, create_tag


@pytest.mark.asyncio
async def test_export_without_api_key(anon_client):
    resp = await anon_client.post("/api/v1/export")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_export_with_wrong_api_key(anon_client):
    resp = await anon_client.post("/api/v1/export", headers={"X-API-Key": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_export_success(async_client, tmp_path):
    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        resp = await async_client.post("/api/v1/export")
    assert resp.status_code == 200
    data = resp.json()
    assert "exported_at" in data
    assert "output_path" in data
    assert "categories_count" in data
    assert "products_count" in data
    assert data["app_env"] == "dev"


@pytest.mark.asyncio
async def test_export_only_includes_published(async_client, tmp_path):
    """仅已发布 (status=2) 的产品才导出。"""
    cat = await create_category(async_client, slug="cat", name="分类", icon="Bot")
    await create_product(
        async_client,
        slug="published",
        name="已发布",
        category_ids=[cat["id"]],
        status=2,
        links=[{"url": "https://published.example.com"}],
    )
    await create_product(async_client, slug="draft", name="草稿", category_ids=[cat["id"]], status=0)
    await create_product(async_client, slug="pending", name="待审核", category_ids=[cat["id"]], status=1)
    await create_product(async_client, slug="archived", name="已下架", category_ids=[cat["id"]], status=3)

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        resp = await async_client.post("/api/v1/export")
    assert resp.json()["products_count"] == 1


@pytest.mark.asyncio
async def test_export_data_format(async_client, tmp_path):
    """验证导出 JSON 格式匹配前端 SiteData 接口。"""
    cat = await create_category(async_client, slug="chat", name="对话", icon="MessageSquare", sort_order=100)
    tag = await create_tag(async_client, slug="free", name="免费")
    await create_product(
        async_client,
        slug="chatgpt",
        name="ChatGPT",
        description="AI 对话助手",
        category_ids=[cat["id"]],
        pricing="freemium",
        featured=True,
        status=2,
        links=[{"url": "https://chat.openai.com", "is_primary": True}],
        tag_ids=[tag["id"]],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)

    assert len(data["categories"]) == 1
    cat_data = data["categories"][0]
    assert cat_data["id"] == "chat"
    assert cat_data["name"] == "对话"
    assert cat_data["icon"] == "MessageSquare"

    assert len(data["products"]) == 1
    prod = data["products"][0]
    assert prod["id"] == "chatgpt"
    assert prod["name"] == "ChatGPT"
    assert prod["description"] == "AI 对话助手"
    assert prod["url"] == "https://chat.openai.com"
    assert prod["categories"] == ["chat"]
    assert prod["tags"] == ["免费"]
    assert prod["pricing"] == "freemium"
    assert prod["featured"] is True
    assert "publishedAt" in prod


@pytest.mark.asyncio
async def test_export_skips_product_without_link(async_client, tmp_path):
    """没有链接的产品不导出（前端 url 必填，空 url 会导致构建失败）。"""
    await create_category(async_client, slug="cat", name="分类")
    await create_product(async_client, slug="no-link", name="无链接", status=2)

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        resp = await async_client.post("/api/v1/export")

    assert resp.json()["products_count"] == 0
    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert data["products"] == []


@pytest.mark.asyncio
async def test_export_skips_product_with_only_inactive_links(async_client, tmp_path):
    """仅有非 active 链接(已失效/已禁用)的产品不导出, 避免死链进入前端。"""
    await create_category(async_client, slug="cat", name="分类")
    await create_product(
        async_client,
        slug="dead-link",
        name="死链产品",
        status=2,
        links=[
            {"url": "https://broken.example.com", "status": 2},
            {"url": "https://disabled.example.com", "status": 3},
        ],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        resp = await async_client.post("/api/v1/export")

    assert resp.json()["products_count"] == 0
    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert data["products"] == []


@pytest.mark.asyncio
async def test_export_prefers_primary_active_link(async_client, tmp_path):
    """多个 active 链接时优先选 is_primary 的。"""
    await create_category(async_client, slug="cat", name="分类")
    await create_product(
        async_client,
        slug="multi-link",
        name="多链接",
        status=2,
        links=[
            {"url": "https://secondary.example.com"},
            {"url": "https://primary.example.com", "is_primary": True},
        ],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert len(data["products"]) == 1
    assert data["products"][0]["url"] == "https://primary.example.com"


@pytest.mark.asyncio
async def test_export_no_relateds_field(async_client, tmp_path):
    """导出数据不含 relateds 字段。"""
    await create_category(async_client, slug="cat", name="分类")
    await create_product(
        async_client,
        slug="p1",
        name="P1",
        status=2,
        links=[{"url": "https://p1.example.com"}],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert "relateds" not in data["products"][0]
