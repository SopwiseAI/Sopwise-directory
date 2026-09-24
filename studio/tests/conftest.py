"""公共 fixtures — 所有测试共享。

设计原则:
  1. 每个测试函数独立，不依赖其他测试的副作用
  2. clean_db 仅在 setup 阶段清理（下一个测试的 setup 会再清理一次，teardown 冗余）
  3. async_client fixture 提供 httpx AsyncClient
  4. api_headers fixture 提供导出端点鉴权
  5. 工厂函数简化测试数据构造
"""

import logging
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, engine
from app.main import app

API_KEY = get_settings().api_key

# 抑制测试中的 SQL 日志
engine.echo = False
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

_TABLES = ["sd_product_tag", "sd_product_link", "sd_product", "sd_category", "sd_tag"]


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    """每个测试前自动清理所有 sd_* 表数据，保证测试隔离。"""
    async with AsyncSessionLocal() as session:
        await session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for table in _TABLES:
            await session.execute(text(f"TRUNCATE TABLE {table}"))
        await session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        await session.commit()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def api_headers() -> dict:
    return {"X-API-Key": API_KEY}


# ── 工厂函数 ──────────────────────────────────────────────────────────────────


async def create_category(
    client: AsyncClient,
    slug: str = "test-cat",
    name: str = "测试分类",
    icon: str = "Bot",
    sort_order: int = 0,
    status: int = 1,
) -> dict:
    resp = await client.post(
        "/api/v1/categories",
        json={"slug": slug, "name": name, "icon": icon, "sort_order": sort_order, "status": status},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_tag(
    client: AsyncClient,
    slug: str = "test-tag",
    name: str = "测试标签",
) -> dict:
    resp = await client.post("/api/v1/tags", json={"slug": slug, "name": name})
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_product(
    client: AsyncClient,
    slug: str = "test-product",
    name: str = "测试产品",
    description: str | None = None,
    category_id: int | None = None,
    pricing: str = "free",
    featured: bool = False,
    sort_order: int = 0,
    status: int = 1,
    links: list[dict] | None = None,
    tag_ids: list[int] | None = None,
) -> dict:
    payload: dict = {
        "slug": slug,
        "name": name,
        "pricing": pricing,
        "featured": featured,
        "sort_order": sort_order,
        "status": status,
    }
    if description is not None:
        payload["description"] = description
    if category_id is not None:
        payload["category_id"] = category_id
    if links:
        payload["links"] = links
    if tag_ids:
        payload["tag_ids"] = tag_ids
    resp = await client.post("/api/v1/products", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_link(
    client: AsyncClient,
    product_id: int,
    url: str = "https://example.com",
    label: str | None = None,
    is_primary: bool = False,
) -> dict:
    payload: dict = {"url": url, "is_primary": is_primary}
    if label:
        payload["label"] = label
    resp = await client.post(f"/api/v1/products/{product_id}/links", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()
