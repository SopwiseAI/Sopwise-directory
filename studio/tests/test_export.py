"""JSON 导出 鉴权 + 数据格式验证 完整测试。"""

import json
from datetime import datetime
from unittest.mock import patch

import pytest
from sqlalchemy import update

from app.core.database import AsyncSessionLocal
from app.exporters.json_exporter import _write_text_atomic, export_to_json
from app.models import Product, ProductLink
from app.schemas.common import ExportResponse
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
async def test_export_to_json_returns_export_response(tmp_path):
    """导出器直接返回 ExportResponse, 避免返回值与响应 schema 隐式对齐。"""
    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        mock.return_value.export_full_path = output
        mock.return_value.app_env = "dev"
        async with AsyncSessionLocal() as session:
            result = await export_to_json(session)
    assert isinstance(result, ExportResponse)
    assert result.output_path == str(output)
    assert result.synced_frontend is False


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


@pytest.mark.asyncio
async def test_export_excludes_disabled_category(async_client, tmp_path):
    """产品挂在禁用分类下时, 导出的 categories 不应包含该禁用分类。"""
    active = await create_category(async_client, slug="active-cat", name="启用", status=1)
    disabled = await create_category(async_client, slug="disabled-cat", name="禁用", status=0)
    await create_product(
        async_client,
        slug="mixed-cat",
        name="混合分类",
        category_ids=[active["id"], disabled["id"]],
        status=2,
        links=[{"url": "https://mixed.example.com"}],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert data["products"][0]["categories"] == ["active-cat"]


@pytest.mark.asyncio
async def test_export_orphan_product_falls_back_to_uncategorized(async_client, tmp_path):
    """产品所有分类均被禁用时回退到合成的未分类(misc), 且分类列表包含该项。"""
    disabled = await create_category(async_client, slug="disabled-only", name="禁用", status=0)
    await create_product(
        async_client,
        slug="orphan",
        name="孤儿产品",
        category_ids=[disabled["id"]],
        status=2,
        links=[{"url": "https://orphan.example.com"}],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert data["products"][0]["categories"] == ["misc"]
    assert data["categories"][-1] == {"id": "misc", "name": "未分类", "icon": "Box"}


@pytest.mark.asyncio
async def test_export_omits_uncategorized_when_not_needed(async_client, tmp_path):
    """没有孤儿产品时不应凭空追加未分类分类。"""
    cat = await create_category(async_client, slug="only-cat", name="正常")
    await create_product(
        async_client,
        slug="normal",
        name="正常产品",
        category_ids=[cat["id"]],
        status=2,
        links=[{"url": "https://normal.example.com"}],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert [c["id"] for c in data["categories"]] == ["only-cat"]


@pytest.mark.asyncio
async def test_export_reuses_real_misc_category(async_client, tmp_path):
    """已存在启用的 misc 分类时应复用, 不得产生重复 category id。"""
    real = await create_category(async_client, slug="misc", name="其他", icon="Box", status=1)
    disabled = await create_category(async_client, slug="disabled-x", name="禁用", status=0)
    await create_product(
        async_client,
        slug="mixed",
        name="混合",
        category_ids=[real["id"], disabled["id"]],
        status=2,
        links=[{"url": "https://mixed2.example.com"}],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert data["products"][0]["categories"] == ["misc"]
    miscs = [c for c in data["categories"] if c["id"] == "misc"]
    assert len(miscs) == 1
    assert miscs[0]["name"] == "其他"


async def test_write_text_atomic_replaces_and_leaves_no_tmp(tmp_path):
    """原子写入应覆盖旧内容且不残留临时文件。"""
    target = tmp_path / "data-dev.json"
    _write_text_atomic(target, "old")
    _write_text_atomic(target, "new")
    assert target.read_text(encoding="utf-8") == "new"
    assert list(tmp_path.glob(".*tmp")) == []


@pytest.mark.asyncio
async def test_export_skips_invalid_records(async_client, tmp_path):
    """pricing 非法或 url 为空(直连改库绕过 API 校验)的产品应被跳过, 避免前端构建失败。"""
    cat = await create_category(async_client, slug="cat", name="分类")
    await create_product(
        async_client,
        slug="good",
        name="Good",
        category_ids=[cat["id"]],
        status=2,
        links=[{"url": "https://good.example.com"}],
    )
    bad_price = await create_product(
        async_client,
        slug="bad-price",
        name="BadPrice",
        category_ids=[cat["id"]],
        status=2,
        links=[{"url": "https://bad-price.example.com"}],
    )
    bad_url = await create_product(
        async_client,
        slug="bad-url",
        name="BadUrl",
        category_ids=[cat["id"]],
        status=2,
        links=[{"url": "https://bad-url.example.com"}],
    )
    async with AsyncSessionLocal() as session:
        await session.execute(update(Product).where(Product.id == bad_price["id"]).values(pricing="enterprise"))
        await session.execute(update(ProductLink).where(ProductLink.product_id == bad_url["id"]).values(url=""))
        await session.commit()

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert [p["id"] for p in data["products"]] == ["good"]


@pytest.mark.asyncio
async def test_export_stable_order_tiebreak_by_id(async_client, tmp_path):
    """sort_order 与 published_at 均相同时按 id 升序, 保证导出顺序稳定。"""
    cat = await create_category(async_client, slug="cat", name="分类")
    first = await create_product(
        async_client, slug="pa", name="PA", category_ids=[cat["id"]], status=2, links=[{"url": "https://a.example.com"}]
    )
    second = await create_product(
        async_client, slug="pb", name="PB", category_ids=[cat["id"]], status=2, links=[{"url": "https://b.example.com"}]
    )
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(Product)
            .where(Product.id.in_([first["id"], second["id"]]))
            .values(sort_order=5, published_at=datetime(2026, 1, 1, 0, 0, 0))
        )
        await session.commit()

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    assert [p["id"] for p in data["products"]] == ["pa", "pb"]


@pytest.mark.asyncio
async def test_export_link_and_category_order_is_deterministic(async_client, tmp_path):
    """多个 active 链接无 primary 时按 sort_order/id 取首个; 分类也按 sort_order/id 稳定排序。"""
    cat_b = await create_category(async_client, slug="cat-b", name="B")
    cat_a = await create_category(async_client, slug="cat-a", name="A")
    await create_product(
        async_client,
        slug="multi",
        name="多链接",
        category_ids=[cat_b["id"], cat_a["id"]],
        status=2,
        links=[{"url": "https://first.example.com"}, {"url": "https://second.example.com"}],
    )

    output = tmp_path / "data-dev.json"
    with patch("app.exporters.json_exporter.get_settings") as mock:
        settings = mock.return_value
        settings.export_full_path = output
        settings.app_env = "dev"
        await async_client.post("/api/v1/export")

    with open(output, encoding="utf-8") as f:
        data = json.load(f)
    prod = data["products"][0]
    assert prod["url"] == "https://first.example.com"
    assert prod["categories"] == ["cat-b", "cat-a"]
