"""级联删除测试 -- 验证外键 ON DELETE CASCADE / RESTRICT 行为。"""

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError

from app.core.database import AsyncSessionLocal
from app.models import ToolLink, ToolTopic
from tests.conftest import create_link, create_tool, create_topic


async def _count(model, column, value: int) -> int:
    async with AsyncSessionLocal() as session:
        stmt = select(func.count()).select_from(model).where(column == value)
        return (await session.execute(stmt)).scalar() or 0


async def test_delete_tool_cascades_links(async_client):
    """删除工具 → 链接自动级联删除。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    await create_link(async_client, tool["id"], url="https://a.com")
    await create_link(async_client, tool["id"], url="https://b.com")

    await async_client.delete(f"/api/v1/tools/{tool['id']}")

    # 工具本身已删除
    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert resp.status_code == 404

    # 链接端点不校验工具存在, 返回空列表; 直连库确认行也没了
    resp = await async_client.get(f"/api/v1/tools/{tool['id']}/links")
    assert resp.status_code == 200
    assert resp.json() == []
    assert await _count(ToolLink, ToolLink.tool_id, tool["id"]) == 0


async def test_delete_tool_cascades_topic_associations(async_client):
    """删除工具 → 工具-主题关联自动级联删除, 但主题本身仍在。"""
    topic = await create_topic(async_client, slug="topic-a", name="A")
    tool = await create_tool(
        async_client,
        slug="t1",
        name="T1",
        topic_ids=[topic["id"]],
        status="published",
        links=[{"url": "https://a.com"}],
    )

    await async_client.delete(f"/api/v1/tools/{tool['id']}")

    # 主题应仍存在
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 200

    # 关联行已级联删除, 计数回到 0
    assert await _count(ToolTopic, ToolTopic.tool_id, tool["id"]) == 0
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tool-count")
    assert resp.json()["tool_count"] == 0
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tools")
    assert resp.json() == []


async def test_delete_topic_rejected_while_tool_attached(async_client):
    """fk_tt_topic 是 RESTRICT: 主题下还有工具时删除应 409, 而不是静默级联。"""
    topic = await create_topic(async_client, slug="topic-a", name="A")
    tool = await create_tool(async_client, slug="t1", name="T1", topic_ids=[topic["id"]])

    resp = await async_client.delete(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 409

    # 主题与工具都还在
    assert (await async_client.get(f"/api/v1/topics/{topic['id']}")).status_code == 200
    assert (await async_client.get(f"/api/v1/tools/{tool['id']}")).status_code == 200


async def test_fk_tt_topic_restrict_at_db_level(async_client):
    """绕过应用层守卫直连删主题, 也应被 fk_tt_topic(RESTRICT)拒绝。"""
    topic = await create_topic(async_client, slug="topic-a", name="A")
    await create_tool(async_client, slug="t1", name="T1", topic_ids=[topic["id"]])

    async with AsyncSessionLocal() as session:
        # 只留一条语句: InnoDB 的 FK RESTRICT 在 DELETE 执行那一刻就报 1451,
        # 不会等到 commit(PT012 要求 raises 块里只有一条简单语句, 原来的
        # session.commit() 永远执行不到)。
        with pytest.raises(IntegrityError):
            await session.execute(text("DELETE FROM xg_topic WHERE id = :topic_id"), {"topic_id": topic["id"]})


async def test_delete_tool_releases_topic(async_client):
    """工具删掉后, 该主题就可以删了(RESTRICT 只挡还挂着的)。"""
    topic = await create_topic(async_client, slug="topic-a", name="A")
    tool = await create_tool(async_client, slug="t1", name="T1", topic_ids=[topic["id"]])

    resp = await async_client.delete(f"/api/v1/tools/{tool['id']}")
    assert resp.status_code == 204

    resp = await async_client.delete(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 204


async def test_delete_tool_does_not_touch_other_tools(async_client):
    """级联只沿本工具走, 不能波及别的工具。"""
    topic = await create_topic(async_client, slug="topic-a", name="A")
    keep = await create_tool(async_client, slug="keep", name="保留", topic_ids=[topic["id"]])
    drop = await create_tool(async_client, slug="drop", name="删除", topic_ids=[topic["id"]])
    await create_link(async_client, keep["id"], url="https://keep.com")
    await create_link(async_client, drop["id"], url="https://drop.com")

    await async_client.delete(f"/api/v1/tools/{drop['id']}")

    assert await _count(ToolLink, ToolLink.tool_id, drop["id"]) == 0
    assert await _count(ToolLink, ToolLink.tool_id, keep["id"]) == 1
    assert await _count(ToolTopic, ToolTopic.tool_id, keep["id"]) == 1
