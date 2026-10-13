"""工具-主题归属(PUT /tools/{id}/topics) 完整测试。

重点守"每个工具至多一个主主题"这条不变量: 在目标态 schema 里它【只由 API 保证】
(库层已没有哨兵列/唯一索引), 所以每个换主用例都同时断言 HTTP 200 与
"库里恰好一个 is_primary 行" —— 只断言状态码的话, 一个"先清旧主再设新主"
写反了的实现会静默留下两个主主题, 排序时谁赢全看运气。
"""

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import ToolTopic
from tests.conftest import create_tool, create_topic


async def _db_tool_topics(tool_id: int) -> list[ToolTopic]:
    async with AsyncSessionLocal() as session:
        stmt = select(ToolTopic).where(ToolTopic.tool_id == tool_id).order_by(ToolTopic.topic_id)
        return list((await session.execute(stmt)).scalars().all())


async def test_set_tool_topics(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_a["id"], topic_b["id"]]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json() == {
        "tool_id": tool["id"],
        "topic_ids": [topic_a["id"], topic_b["id"]],
        # 没给 primary_topic_id 且原本没有主主题 -> 取集合第一个
        "primary_topic_id": topic_a["id"],
    }

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert {t["id"] for t in resp.json()["topics"]} == {topic_a["id"], topic_b["id"]}


async def test_update_tool_topics_replace(async_client):
    """整体替换, 不是追加。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    topic_c = await create_topic(async_client, slug="topic-c", name="C")

    await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": [topic_a["id"], topic_b["id"]]})
    resp = await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": [topic_c["id"]]})
    assert resp.status_code == 200, resp.text
    assert resp.json()["topic_ids"] == [topic_c["id"]]
    assert resp.json()["primary_topic_id"] == topic_c["id"]

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert [t["slug"] for t in resp.json()["topics"]] == ["topic-c"]


async def test_clear_tool_topics(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    topic = await create_topic(async_client, slug="topic-a", name="A")
    await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": [topic["id"]]})

    resp = await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": []})
    assert resp.status_code == 200, resp.text
    assert resp.json()["topic_ids"] == []
    assert resp.json()["primary_topic_id"] is None

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert resp.json()["topics"] == []
    assert resp.json()["primary_topic_id"] is None


async def test_duplicate_topic_ids_are_idempotent(async_client):
    """重复的 topic_id 应去重, 而非触发主键冲突(409)。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    topic = await create_topic(async_client, slug="topic-a", name="A")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic["id"], topic["id"]]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["topic_ids"] == [topic["id"]]
    assert resp.json()["primary_topic_id"] == topic["id"]

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert len(resp.json()["topics"]) == 1


async def test_omitted_primary_keeps_existing_primary(async_client):
    """省略 primary_topic_id 时, 只要原主主题还在新集合里就保留它。"""
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    tool = await create_tool(
        async_client,
        slug="keep-primary",
        name="保留主主题",
        topic_ids=[topic_a["id"], topic_b["id"]],
        primary_topic_id=topic_b["id"],
    )
    assert tool["primary_topic_id"] == topic_b["id"]

    # 顺序换一下但内容不变: 主主题不能因此漂移
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_b["id"], topic_a["id"]]},
    )
    assert resp.status_code == 200, resp.text
    # 响应按 is_primary DESC 排序, 主主题在最前
    assert resp.json()["topic_ids"] == [topic_b["id"], topic_a["id"]]
    assert resp.json()["primary_topic_id"] == topic_b["id"]

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert resp.json()["primary_topic_id"] == topic_b["id"]

    rows = await _db_tool_topics(tool["id"])
    assert [row.topic_id for row in rows if row.is_primary] == [topic_b["id"]]


async def test_omitted_primary_falls_back_to_first(async_client):
    """原主主题被移除时, 退而取新集合的第一个。"""
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    topic_c = await create_topic(async_client, slug="topic-c", name="C")
    tool = await create_tool(
        async_client,
        slug="fallback",
        name="回退主主题",
        topic_ids=[topic_a["id"]],
        primary_topic_id=topic_a["id"],
    )

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_b["id"], topic_c["id"]]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["topic_ids"] == [topic_b["id"], topic_c["id"]]
    assert resp.json()["primary_topic_id"] == topic_b["id"]

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert resp.json()["primary_topic_id"] == topic_b["id"]


async def test_explicit_primary_selection(async_client):
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    tool = await create_tool(async_client, slug="t1", name="T1", topic_ids=[topic_a["id"]])

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_a["id"], topic_b["id"]], "primary_topic_id": topic_b["id"]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["topic_ids"] == [topic_b["id"], topic_a["id"]]
    assert resp.json()["primary_topic_id"] == topic_b["id"]

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert resp.json()["primary_topic_id"] == topic_b["id"]


async def test_add_topic_and_switch_primary_in_one_call(async_client):
    """同一次调用里既加新主题又换主主题 -- 最容易留下两个主主题的组合。"""
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    tool = await create_tool(
        async_client,
        slug="combo",
        name="组合操作",
        topic_ids=[topic_a["id"]],
        primary_topic_id=topic_a["id"],
    )

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_a["id"], topic_b["id"]], "primary_topic_id": topic_b["id"]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["primary_topic_id"] == topic_b["id"]

    rows = await _db_tool_topics(tool["id"])
    assert {row.topic_id for row in rows} == {topic_a["id"], topic_b["id"]}
    assert [row.topic_id for row in rows if row.is_primary] == [topic_b["id"]]


async def test_swap_primary_back_and_forth(async_client):
    """来回换主主题后库里仍恰好一个主主题(该不变量只由 API 保证)。"""
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    tool = await create_tool(
        async_client,
        slug="swap",
        name="反复换主",
        topic_ids=[topic_a["id"], topic_b["id"]],
        primary_topic_id=topic_a["id"],
    )

    for target in (topic_b, topic_a, topic_b):
        resp = await async_client.put(
            f"/api/v1/tools/{tool['id']}/topics",
            json={"topic_ids": [topic_a["id"], topic_b["id"]], "primary_topic_id": target["id"]},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["topic_ids"][0] == target["id"]
        assert resp.json()["primary_topic_id"] == target["id"]

    rows = await _db_tool_topics(tool["id"])
    assert [row.topic_id for row in rows if row.is_primary] == [topic_b["id"]]


async def test_reordering_topics_is_preserved(async_client):
    """topic_ids 的给定顺序要能通过 primary 体现出来(次要主题间按 topic_id 排序)。"""
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    topic_c = await create_topic(async_client, slug="topic-c", name="C")
    tool = await create_tool(async_client, slug="t1", name="T1")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_c["id"], topic_b["id"], topic_a["id"]], "primary_topic_id": topic_c["id"]},
    )
    assert resp.status_code == 200, resp.text
    # 主主题第一, 其余按 topic_id 升序
    assert resp.json()["topic_ids"] == [topic_c["id"], topic_a["id"], topic_b["id"]]
    assert resp.json()["primary_topic_id"] == topic_c["id"]


async def test_set_topics_with_invalid_id(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    topic = await create_topic(async_client, slug="topic-a", name="A")
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic["id"], 99999]},
    )
    assert resp.status_code == 400
    assert "99999" in resp.json()["detail"]


async def test_set_topics_nonexistent_tool(async_client):
    topic = await create_topic(async_client, slug="topic-a", name="A")
    resp = await async_client.put("/api/v1/tools/99999/topics", json={"topic_ids": [topic["id"]]})
    assert resp.status_code == 404


async def test_primary_topic_must_be_in_topic_ids(async_client):
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    tool = await create_tool(async_client, slug="t1", name="T1")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_a["id"]], "primary_topic_id": topic_b["id"]},
    )
    assert resp.status_code == 422


async def test_tool_topics_declares_response_model(async_client):
    """PUT /tools/{id}/topics 应声明 response_model, 且响应必须带 primary_topic_id。"""
    resp = await async_client.get("/openapi.json")
    schema = resp.json()["components"]["schemas"]["ToolTopicsResponse"]
    assert set(schema["properties"]) == {"tool_id", "topic_ids", "primary_topic_id"}


async def test_primary_topic_id_reflects_real_primary(async_client):
    """primary_topic_id 是真回读的主主题, 不是拿 topic_ids[0] 反推的。

    这里刻意让请求里的顺序与最终主主题不同(primary 显式给第二个),
    再对比响应中的 primary_topic_id —— 它必须等于那个真实主主题。
    """
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    tool = await create_tool(async_client, slug="real-primary", name="真主主题")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/topics",
        json={"topic_ids": [topic_a["id"], topic_b["id"]], "primary_topic_id": topic_b["id"]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["primary_topic_id"] == topic_b["id"]

    # 库里的 is_primary 与该字段一致(不是两个答案)
    rows = await _db_tool_topics(tool["id"])
    assert [row.topic_id for row in rows if row.is_primary] == [topic_b["id"]]

    # 清空归属 -> 零主主题, 字段回到 null
    resp = await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": []})
    assert resp.json()["primary_topic_id"] is None


async def test_topic_is_not_deleted_with_association(async_client):
    """解除归属只是删关联行, 主题本身必须还在。"""
    topic = await create_topic(async_client, slug="topic-a", name="A")
    tool = await create_tool(async_client, slug="t1", name="T1", topic_ids=[topic["id"]])

    await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": []})

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 200
