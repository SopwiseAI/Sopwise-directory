"""主题 CRUD + 计数口径 + 删除守卫 完整测试。"""

from tests.conftest import create_link, create_tool, create_topic


async def test_create_topic(async_client):
    resp = await async_client.post(
        "/api/v1/topics",
        json={"slug": "chat", "name": "对话", "icon": "MessageSquare", "sort_order": 100},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["slug"] == "chat"
    assert data["name"] == "对话"
    assert data["icon"] == "MessageSquare"
    assert data["sort_order"] == 100
    assert data["status"] == "active"
    assert data["tool_count"] == 0
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


async def test_create_topic_defaults(async_client):
    """icon / sort_order / status 都有默认值, 只给 slug+name 即可。"""
    resp = await async_client.post("/api/v1/topics", json={"slug": "minimal", "name": "最小主题"})
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["icon"] == "📦"
    assert data["sort_order"] == 0
    assert data["status"] == "active"
    assert data["description"] is None


async def test_create_topic_duplicate_slug(async_client):
    await create_topic(async_client, slug="chat", name="对话")
    resp = await async_client.post(
        "/api/v1/topics",
        json={"slug": "chat", "name": "其他", "icon": "Bot"},
    )
    assert resp.status_code == 409
    assert "Slug already exists" in resp.json()["detail"]


async def test_create_topic_duplicate_name(async_client):
    await create_topic(async_client, slug="topic-a", name="重复名")
    resp = await async_client.post(
        "/api/v1/topics",
        json={"slug": "topic-b", "name": "重复名", "icon": "Bot"},
    )
    assert resp.status_code == 409
    assert "Topic name already exists" in resp.json()["detail"]


async def test_create_topic_rejects_bad_slug(async_client):
    """slug 必须 kebab-case 小写: 写入端 Pydantic pattern 先拦成 422。"""
    resp = await async_client.post("/api/v1/topics", json={"slug": "Bad Slug", "name": "非法"})
    assert resp.status_code == 422


async def test_list_topics_sorted_by_sort_order(async_client):
    await create_topic(async_client, slug="topic-a", name="A", sort_order=10)
    await create_topic(async_client, slug="topic-b", name="B", sort_order=100)
    await create_topic(async_client, slug="topic-c", name="C", sort_order=50)
    resp = await async_client.get("/api/v1/topics")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    # sort_order DESC, 并列时 id ASC
    assert [t["name"] for t in data] == ["B", "C", "A"]


async def test_list_topics_tie_break_by_id(async_client):
    await create_topic(async_client, slug="topic-a", name="A", sort_order=5)
    await create_topic(async_client, slug="topic-b", name="B", sort_order=5)
    resp = await async_client.get("/api/v1/topics")
    assert [t["name"] for t in resp.json()] == ["A", "B"]


async def test_list_topics_filter_by_status(async_client):
    await create_topic(async_client, slug="topic-on", name="启用", status="active")
    await create_topic(async_client, slug="topic-off", name="禁用", status="disabled")
    resp = await async_client.get("/api/v1/topics?status=active")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "启用"

    resp = await async_client.get("/api/v1/topics?status=disabled")
    assert [t["name"] for t in resp.json()] == ["禁用"]


async def test_list_topics_rejects_out_of_range_status(async_client):
    """status 是 StrEnum(disabled/active), 非法值应 422 而非静默返回空列表。"""
    resp = await async_client.get("/api/v1/topics?status=bogus")
    assert resp.status_code == 422


async def test_get_topic_by_id(async_client):
    topic = await create_topic(async_client, slug="topic-1", name="主题1")
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "主题1"


async def test_get_topic_not_found(async_client):
    resp = await async_client.get("/api/v1/topics/99999")
    assert resp.status_code == 404


async def test_update_topic(async_client):
    topic = await create_topic(async_client, slug="old-slug", name="旧名")
    resp = await async_client.put(
        f"/api/v1/topics/{topic['id']}",
        json={"name": "新名", "sort_order": 200},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "新名"
    assert data["sort_order"] == 200
    assert data["slug"] == "old-slug"


async def test_update_topic_slug_conflict(async_client):
    await create_topic(async_client, slug="slug-a", name="A")
    topic_b = await create_topic(async_client, slug="slug-b", name="B")
    resp = await async_client.put(f"/api/v1/topics/{topic_b['id']}", json={"slug": "slug-a"})
    assert resp.status_code == 409


async def test_update_topic_name_conflict(async_client):
    await create_topic(async_client, slug="slug-a", name="名字A")
    topic_b = await create_topic(async_client, slug="slug-b", name="名字B")
    resp = await async_client.put(f"/api/v1/topics/{topic_b['id']}", json={"name": "名字A"})
    assert resp.status_code == 409


async def test_update_topic_not_found(async_client):
    resp = await async_client.put("/api/v1/topics/99999", json={"name": "无此主题"})
    assert resp.status_code == 404


async def test_update_topic_can_disable(async_client):
    topic = await create_topic(async_client, slug="toggle", name="切换")
    resp = await async_client.put(f"/api/v1/topics/{topic['id']}", json={"status": "disabled"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "disabled"


async def test_delete_topic_empty(async_client):
    topic = await create_topic(async_client, slug="del-me", name="待删除")
    resp = await async_client.delete(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 204
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 404


async def test_delete_topic_not_found(async_client):
    resp = await async_client.delete("/api/v1/topics/99999")
    assert resp.status_code == 404


async def test_delete_topic_with_tools_rejected(async_client):
    """fk_tt_topic 是 RESTRICT: 主题下还挂着工具时删除应被拦成 409。"""
    topic = await create_topic(async_client, slug="has-tool", name="有工具")
    await create_tool(async_client, slug="tool-1", name="工具1", topic_ids=[topic["id"]])
    resp = await async_client.delete(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 409
    detail = resp.json()["detail"]
    assert "1 tools" in detail
    assert "reassign" in detail


async def test_delete_topic_guard_counts_all_statuses(async_client):
    """删除守卫要拦住所有状态的工具(含草稿), 口径与 tool_count 刻意不同。"""
    topic = await create_topic(async_client, slug="mix-topic", name="混合")
    await create_tool(
        async_client,
        slug="m-pub",
        name="已发布",
        topic_ids=[topic["id"]],
        status="published",
        links=[{"url": "https://m-pub.example.com"}],
    )
    await create_tool(async_client, slug="m-draft", name="草稿", topic_ids=[topic["id"]])

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tool-count")
    assert resp.json()["tool_count"] == 1

    resp = await async_client.delete(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 409
    detail = resp.json()["detail"]
    assert "2 tools" in detail
    assert "unpublished" in detail


async def test_delete_topic_after_reassign(async_client):
    """先把工具从主题摘掉, 就能删除该主题(且工具本身还在)。"""
    topic = await create_topic(async_client, slug="cat", name="分类")
    tool = await create_tool(async_client, slug="tool-1", name="工具1", topic_ids=[topic["id"]])

    resp = await async_client.put(f"/api/v1/tools/{tool['id']}/topics", json={"topic_ids": []})
    assert resp.status_code == 200

    resp = await async_client.delete(f"/api/v1/topics/{topic['id']}")
    assert resp.status_code == 204

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}")
    assert resp.status_code == 200
    assert resp.json()["topic_ids"] == []


async def test_tool_count_only_published_with_active_link(async_client):
    """tool_count 口径 = published 且有 active 链接(导出投影), 四个条件缺一不可。"""
    topic = await create_topic(async_client, slug="count-topic", name="计数")

    # 计入: published + active 链接
    await create_tool(
        async_client,
        slug="counted",
        name="计入",
        topic_ids=[topic["id"]],
        status="published",
        links=[{"url": "https://counted.example.com"}],
    )
    # 不计入: published 但没有链接
    await create_tool(async_client, slug="no-link", name="无链接", topic_ids=[topic["id"]], status="published")
    # 不计入: published 但链接不是 active
    await create_tool(
        async_client,
        slug="broken-link",
        name="死链",
        topic_ids=[topic["id"]],
        status="published",
        links=[{"url": "https://broken.example.com", "status": "broken"}],
    )
    # 不计入: 有 active 链接但还没发布
    await create_tool(
        async_client,
        slug="not-published",
        name="未发布",
        topic_ids=[topic["id"]],
        status="pending",
        links=[{"url": "https://pending.example.com"}],
    )

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tool-count")
    assert resp.status_code == 200
    assert resp.json() == {"tool_count": 1}

    # 详情与列表里的 tool_count 必须与 /tool-count 逐字一致
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}")
    assert resp.json()["tool_count"] == 1
    resp = await async_client.get("/api/v1/topics")
    assert resp.json()[0]["tool_count"] == 1


async def test_topic_tool_count_ignores_broken_primary_fallback(async_client):
    """主链接失效但仍有其它 active 链接时, 该工具依然计入(成员规则只看是否存在 active 链接)。"""
    topic = await create_topic(async_client, slug="fallback-topic", name="回退")
    tool = await create_tool(
        async_client,
        slug="fallback",
        name="回退工具",
        topic_ids=[topic["id"]],
        status="published",
        links=[
            {"url": "https://live.example.com"},
            {"url": "https://dead.example.com", "is_primary": True},
        ],
    )
    dead = next(lnk for lnk in tool["links"] if lnk["is_primary"])
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{dead['id']}",
        json={"status": "broken"},
    )
    assert resp.status_code == 200

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tool-count")
    assert resp.json()["tool_count"] == 1


async def test_topic_tools_returns_all_statuses(async_client):
    """GET /topics/{id}/tools 是后台接口, 刻意不过滤 status(与 /tool-count 口径不同)。"""
    topic = await create_topic(async_client, slug="all-topic", name="全部状态")
    await create_tool(async_client, slug="t-draft", name="草稿", topic_ids=[topic["id"]], status="draft")
    await create_tool(async_client, slug="t-pending", name="待审", topic_ids=[topic["id"]], status="pending")
    await create_tool(
        async_client,
        slug="t-published",
        name="已发布",
        topic_ids=[topic["id"]],
        status="published",
        links=[{"url": "https://published.example.com"}],
    )
    await create_tool(async_client, slug="t-archived", name="已下架", topic_ids=[topic["id"]], status="archived")

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tools")
    assert resp.status_code == 200
    statuses = {t["status"] for t in resp.json()}
    assert statuses == {"draft", "pending", "published", "archived"}

    # 同一条数据, 计数口径只算 1
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tool-count")
    assert resp.json()["tool_count"] == 1


async def test_topic_tools_excludes_other_topics(async_client):
    topic_a = await create_topic(async_client, slug="topic-a", name="A")
    topic_b = await create_topic(async_client, slug="topic-b", name="B")
    await create_tool(async_client, slug="in-a", name="在A", topic_ids=[topic_a["id"]])
    await create_tool(async_client, slug="in-b", name="在B", topic_ids=[topic_b["id"]])

    resp = await async_client.get(f"/api/v1/topics/{topic_a['id']}/tools")
    assert [t["slug"] for t in resp.json()] == ["in-a"]


async def test_topic_tools_not_found(async_client):
    resp = await async_client.get("/api/v1/topics/99999/tools")
    assert resp.status_code == 404


async def test_tool_count_not_found(async_client):
    """不存在的主题取计数应 404, 与详情端点语义一致。"""
    resp = await async_client.get("/api/v1/topics/99999/tool-count")
    assert resp.status_code == 404


async def test_tool_count_declares_response_model(async_client):
    """/tool-count 应声明 response_model, 以便生成 OpenAPI schema。"""
    resp = await async_client.get("/openapi.json")
    assert "TopicCountResponse" in resp.json()["components"]["schemas"]


async def test_update_topic_ignores_explicit_null(async_client):
    """显式传 null 的非空字段应视为未提供, 不应触发 409/500。"""
    topic = await create_topic(async_client, slug="null-topic", name="空值", icon="Bot", status="active")
    resp = await async_client.put(
        f"/api/v1/topics/{topic['id']}",
        json={"slug": None, "name": None, "icon": None, "sort_order": None, "status": None},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["slug"] == "null-topic"
    assert data["name"] == "空值"
    # icon 是 NOT NULL 列, 显式 null 只能忽略(清空它会换来 500)
    assert data["icon"] == "Bot"
    assert data["status"] == "active"


async def test_update_topic_can_clear_description(async_client):
    """description 为可空字段, 显式 null 应能清空。"""
    topic = await create_topic(async_client, slug="desc-topic", name="描述", description="原描述")
    resp = await async_client.put(f"/api/v1/topics/{topic['id']}", json={"description": None})
    assert resp.status_code == 200, resp.text
    assert resp.json()["description"] is None


async def test_update_topic_reflects_tool_count(async_client):
    """PUT 响应的 tool_count 也必须是真实值, 不能停在默认 0。"""
    topic = await create_topic(async_client, slug="put-count", name="PUT计数")
    await create_tool(
        async_client,
        slug="put-counted",
        name="计入",
        topic_ids=[topic["id"]],
        status="published",
        links=[{"url": "https://put-counted.example.com"}],
    )
    resp = await async_client.put(f"/api/v1/topics/{topic['id']}", json={"sort_order": 7})
    assert resp.status_code == 200
    assert resp.json()["tool_count"] == 1


async def test_topic_tools_pagination(async_client):
    topic = await create_topic(async_client, slug="page-topic", name="分页")
    for i in range(5):
        await create_tool(async_client, slug=f"page-{i}", name=f"P{i}", topic_ids=[topic["id"]])

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tools?page=1&page_size=2")
    assert len(resp.json()) == 2
    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tools?page=3&page_size=2")
    assert len(resp.json()) == 1


async def test_topic_tools_order_is_deterministic_on_tie(async_client):
    """sort_order / published_at 并列时按 id 升序, 保证翻页稳定。"""
    topic = await create_topic(async_client, slug="tie-topic", name="并列")
    a = await create_tool(async_client, slug="tie-a", name="A", topic_ids=[topic["id"]])
    b = await create_tool(async_client, slug="tie-b", name="B", topic_ids=[topic["id"]])
    c = await create_tool(async_client, slug="tie-c", name="C", topic_ids=[topic["id"]])

    page1 = (await async_client.get(f"/api/v1/topics/{topic['id']}/tools?page=1&page_size=2")).json()
    page2 = (await async_client.get(f"/api/v1/topics/{topic['id']}/tools?page=2&page_size=2")).json()
    assert [t["id"] for t in page1 + page2] == [a["id"], b["id"], c["id"]]


async def test_add_link_helper_is_wired_to_tools_endpoint(async_client):
    """create_link 工厂打的是 /tools/{id}/links, 顺带守一条最基本的链接 CRUD。"""
    tool = await create_tool(async_client, slug="link-holder", name="持链接")
    link = await create_link(async_client, tool["id"], url="https://docs.example.com", label="docs")
    assert link["tool_id"] == tool["id"]
    assert link["label"] == "docs"
    assert link["status"] == "active"


async def test_list_topics_pagination(async_client):
    for index in range(5):
        await create_topic(async_client, slug=f"page-{index}", name=f"P{index}")

    assert len((await async_client.get("/api/v1/topics?page=1&page_size=2")).json()) == 2
    assert len((await async_client.get("/api/v1/topics?page=2&page_size=2")).json()) == 2
    assert len((await async_client.get("/api/v1/topics?page=3&page_size=2")).json()) == 1


async def test_create_topic_rejects_numeric_status(async_client):
    """status 是 StrEnum: 旧的 0/1 魔法数字应 422, 不能静默当成 active。"""
    for status in (0, 1, "enabled"):
        resp = await async_client.post(
            "/api/v1/topics",
            json={"slug": "num-status", "name": "数字状态", "status": status},
        )
        assert resp.status_code == 422, f"{status!r}: {resp.text}"


async def test_topic_tools_works_for_disabled_topic(async_client):
    """禁用只影响导出与默认过滤, 主题详情的工具列表仍可读(后台要能整理)。"""
    topic = await create_topic(async_client, slug="off-topic", name="禁用主题", status="disabled")
    await create_tool(async_client, slug="in-off", name="在禁用主题里", topic_ids=[topic["id"]])

    resp = await async_client.get(f"/api/v1/topics/{topic['id']}/tools")
    assert resp.status_code == 200
    assert [t["slug"] for t in resp.json()] == ["in-off"]
