"""工具链接 CRUD + 主链接互斥 + URL 归一化 完整测试。"""

import hashlib

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import LinkStatus, ToolLink
from app.utils.url import url_hash
from tests.conftest import create_link, create_tool


async def _db_links(tool_id: int) -> list[ToolLink]:
    """直连读回链接行 -- 响应里的 url 是归一化值, 且响应不含 url_hash, 核对 hash 只能看库。"""
    async with AsyncSessionLocal() as session:
        stmt = select(ToolLink).where(ToolLink.tool_id == tool_id).order_by(ToolLink.id)
        return list((await session.execute(stmt)).scalars().all())


async def test_add_link(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://example.com", label="website")
    assert link["url"] == "https://example.com/"  # 响应回的是归一化值: 根路径保留尾斜杠
    assert link["label"] == "website"
    assert link["is_primary"] is False
    assert link["status"] == "active"
    assert link["sort_order"] == 0
    assert link["tool_id"] == tool["id"]
    assert link["last_link_check_at"] is None
    assert "id" in link


async def test_add_link_default_label_and_status(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    resp = await async_client.post(f"/api/v1/tools/{tool['id']}/links", json={"url": "https://example.com"})
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["label"] == "other"
    assert data["status"] == "active"
    assert data["is_primary"] is False


async def test_add_primary_link(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://example.com", is_primary=True)
    assert link["is_primary"] is True


async def test_second_primary_link_demotes_first(async_client):
    """设新的主链接不再返回 409, 而是把旧主链接降级(库里始终只有一个主链接)。"""
    tool = await create_tool(async_client, slug="swap", name="换主")
    first = await create_link(async_client, tool["id"], url="https://first.com", is_primary=True)

    resp = await async_client.post(
        f"/api/v1/tools/{tool['id']}/links",
        json={"url": "https://second.com", "is_primary": True},
    )
    assert resp.status_code == 201, resp.text
    second = resp.json()
    assert second["is_primary"] is True

    links = {lnk["id"]: lnk for lnk in (await async_client.get(f"/api/v1/tools/{tool['id']}/links")).json()}
    assert links[first["id"]]["is_primary"] is False
    assert links[second["id"]]["is_primary"] is True

    # 库里确实只剩一个主链接
    rows = await _db_links(tool["id"])
    assert sum(1 for row in rows if row.is_primary) == 1


async def test_update_link_to_primary_demotes_old(async_client):
    """把非主链接改成主链接: 旧主链接自动降级, 不返回 409。"""
    tool = await create_tool(async_client, slug="swap", name="换主")
    old = await create_link(async_client, tool["id"], url="https://a.com", is_primary=True)
    new = await create_link(async_client, tool["id"], url="https://b.com", is_primary=False)

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{new['id']}",
        json={"is_primary": True},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_primary"] is True

    links = {lnk["id"]: lnk for lnk in (await async_client.get(f"/api/v1/tools/{tool['id']}/links")).json()}
    assert links[old["id"]]["is_primary"] is False
    assert links[new["id"]]["is_primary"] is True


async def test_swap_primary_back_and_forth(async_client):
    """来回换主链接后库里仍只有一个主链接 -- 该不变量只由 API 保证, 不靠任何唯一索引。"""
    tool = await create_tool(async_client, slug="swap2", name="反复换主")
    a = await create_link(async_client, tool["id"], url="https://a.com", is_primary=True)
    b = await create_link(async_client, tool["id"], url="https://b.com")

    for target in (b, a, b):
        resp = await async_client.put(
            f"/api/v1/tools/{tool['id']}/links/{target['id']}",
            json={"is_primary": True},
        )
        assert resp.status_code == 200, resp.text

    rows = await _db_links(tool["id"])
    assert [row.id for row in rows if row.is_primary] == [b["id"]]


async def test_set_primary_twice_is_idempotent(async_client):
    """对已是主链接的链接重复设主应 200(无其它主链接)。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://a.com", is_primary=True)
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"is_primary": True},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_primary"] is True


async def test_unset_primary_leaves_no_primary(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://a.com", is_primary=True)
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"is_primary": False},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_primary"] is False


async def test_url_normalization_dedup(async_client):
    """https://www.example.com/ 与 https://example.com 应判为同一 URL。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    await create_link(async_client, tool["id"], url="https://example.com")
    resp = await async_client.post(
        f"/api/v1/tools/{tool['id']}/links",
        json={"url": "https://www.example.com/"},
    )
    assert resp.status_code == 409
    assert "URL already exists" in resp.json()["detail"]


async def test_url_is_stored_normalized_and_hash_matches(async_client):
    """库里【只】存归一化后的 url(不保留原始输入), 响应也回归一化值; url_hash = sha256(它)。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    raw = "https://www.Example.com:443/foo/#top"
    link = await create_link(async_client, tool["id"], url=raw)
    assert link["url"] == "https://example.com/foo"

    row = (await _db_links(tool["id"]))[0]
    assert row.url == "https://example.com/foo"
    assert row.url_hash == hashlib.sha256(b"https://example.com/foo").hexdigest()
    assert row.url_hash == url_hash(raw)


async def test_update_link_url_rewrites_url_and_hash(async_client):
    """改 url 时 url 与 url_hash 成对更新, 不能只改 url 让 hash 停在旧值。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://old.example.com")
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"url": "https://new.example.com/path/"},
    )
    assert resp.status_code == 200, resp.text

    row = (await _db_links(tool["id"]))[0]
    assert row.url == "https://new.example.com/path"
    assert row.url_hash == url_hash("https://new.example.com/path/")


async def test_http_url_rejected_for_non_local_host(async_client):
    """非本地主机必须 https: 这是写入端刻意加的规则, 与归一化规则第 1 条一致。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    resp = await async_client.post(
        f"/api/v1/tools/{tool['id']}/links",
        json={"url": "http://www.example.com/foo"},
    )
    assert resp.status_code == 422, resp.text


async def test_http_url_allowed_for_localhost(async_client):
    """本地地址是唯一允许 http 的例外。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="http://localhost:3000/app")
    assert link["url"] == "http://localhost:3000/app"

    row = (await _db_links(tool["id"]))[0]
    assert row.url == "http://localhost:3000/app"


async def test_url_dedup_cross_tools(async_client):
    """同一 URL 可以挂到不同工具上(url_hash 是工具内唯一)。"""
    tool_a = await create_tool(async_client, slug="ta", name="TA")
    tool_b = await create_tool(async_client, slug="tb", name="TB")
    await create_link(async_client, tool_a["id"], url="https://shared.com")
    resp = await async_client.post(
        f"/api/v1/tools/{tool_b['id']}/links",
        json={"url": "https://shared.com"},
    )
    assert resp.status_code == 201


async def test_update_link_url_to_duplicate_rejected(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    await create_link(async_client, tool["id"], url="https://a.com")
    link = await create_link(async_client, tool["id"], url="https://b.com")
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"url": "https://www.a.com/"},
    )
    assert resp.status_code == 409, resp.text
    assert "URL already exists" in resp.json()["detail"]


async def test_list_tool_links(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    await create_link(async_client, tool["id"], url="https://a.com", label="docs", is_primary=True)
    await create_link(async_client, tool["id"], url="https://b.com", label="api")

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}/links")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_list_tool_links_unknown_tool_returns_empty(async_client):
    """/tools/{id}/links 不校验工具存在: 未知工具返回 [], 不是 404。"""
    resp = await async_client.get("/api/v1/tools/99999/links")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_links_order_is_deterministic(async_client):
    """sort_order DESC, id ASC。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    low = await create_link(async_client, tool["id"], url="https://low.com", sort_order=1)
    high = await create_link(async_client, tool["id"], url="https://high.com", sort_order=9)
    same_a = await create_link(async_client, tool["id"], url="https://same-a.com", sort_order=5)
    same_b = await create_link(async_client, tool["id"], url="https://same-b.com", sort_order=5)

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}/links")
    assert [lnk["id"] for lnk in resp.json()] == [high["id"], same_a["id"], same_b["id"], low["id"]]


async def test_update_link(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://old.com", label="docs")
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"label": "api", "url": "https://new.com"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["label"] == "api"
    assert data["url"] == "https://new.com/"


async def test_update_link_status(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://example.com")
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"status": "broken"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "broken"


async def test_update_link_rejects_unknown_status(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://example.com")
    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"status": "draft"},
    )
    assert resp.status_code == 422


async def test_list_links_filter_by_status(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    await create_link(async_client, tool["id"], url="https://a.com", status="active")
    await create_link(async_client, tool["id"], url="https://b.com", status="broken")

    resp = await async_client.get(f"/api/v1/tools/{tool['id']}/links?status=active")
    assert resp.status_code == 200
    links = resp.json()
    assert len(links) == 1
    assert links[0]["status"] == "active"


async def test_list_links_rejects_out_of_range_status(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    resp = await async_client.get(f"/api/v1/tools/{tool['id']}/links?status=9")
    assert resp.status_code == 422


async def test_delete_link(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://del.com")
    resp = await async_client.delete(f"/api/v1/tools/{tool['id']}/links/{link['id']}")
    assert resp.status_code == 204
    resp = await async_client.get(f"/api/v1/tools/{tool['id']}/links")
    assert resp.json() == []


async def test_delete_link_wrong_tool(async_client):
    """链接不属于该工具时应 404, 不能跨工具误删。"""
    tool_a = await create_tool(async_client, slug="ta", name="TA")
    tool_b = await create_tool(async_client, slug="tb", name="TB")
    link = await create_link(async_client, tool_a["id"], url="https://a.com")

    resp = await async_client.delete(f"/api/v1/tools/{tool_b['id']}/links/{link['id']}")
    assert resp.status_code == 404
    resp = await async_client.get(f"/api/v1/tools/{tool_a['id']}/links")
    assert len(resp.json()) == 1


async def test_add_link_to_nonexistent_tool(async_client):
    resp = await async_client.post("/api/v1/tools/99999/links", json={"url": "https://example.com"})
    assert resp.status_code == 404


async def test_update_link_not_found(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    resp = await async_client.put(f"/api/v1/tools/{tool['id']}/links/99999", json={"label": "api"})
    assert resp.status_code == 404


async def test_update_link_ignores_explicit_null(async_client):
    """显式传 null 的非空字段应视为未提供, 不应触发 409/500。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://keep.com", label="website")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"url": None, "is_primary": None, "status": None, "label": None, "sort_order": None},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["url"] == "https://keep.com/"
    assert data["label"] == "website"
    assert data["status"] == "active"


async def test_link_label_enum_values(async_client):
    """label 的 8 个合法取值都应能写入。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    labels = ["website", "api", "docs", "github", "playground", "pricing", "plugin", "other"]
    for index, label in enumerate(labels):
        resp = await async_client.post(
            f"/api/v1/tools/{tool['id']}/links",
            json={"url": f"https://link-{index}.example.com", "label": label},
        )
        assert resp.status_code == 201, f"{label}: {resp.text}"
        assert resp.json()["label"] == label


async def test_link_rejects_unknown_label(async_client):
    tool = await create_tool(async_client, slug="t1", name="T1")
    resp = await async_client.post(
        f"/api/v1/tools/{tool['id']}/links",
        json={"url": "https://example.com", "label": "主页"},
    )
    assert resp.status_code == 422


async def test_link_status_enum_matches_db(async_client):
    """LinkStatus 的取值应与库里 ENUM 一致(active/broken/disabled)。"""
    assert {status.value for status in LinkStatus} == {"active", "broken", "disabled"}


async def test_update_link_with_equivalent_url_keeps_url_and_hash(async_client):
    """换个写法但归一化后相同的 url 不算改: 不 409(排除自身)、也不重写 url/hash。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    link = await create_link(async_client, tool["id"], url="https://same.example.com/path/")
    before = (await _db_links(tool["id"]))[0]

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{link['id']}",
        json={"url": "https://www.same.example.com/path/#top"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["url"] == "https://same.example.com/path"

    after = (await _db_links(tool["id"]))[0]
    assert after.url == before.url
    assert after.url_hash == before.url_hash


async def test_add_same_url_with_different_label_still_rejected(async_client):
    """去重看的是归一化后的 url, 换个 label 不算新链接。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    await create_link(async_client, tool["id"], url="https://same.example.com", label="docs")
    resp = await async_client.post(
        f"/api/v1/tools/{tool['id']}/links",
        json={"url": "https://www.same.example.com/", "label": "api"},
    )
    assert resp.status_code == 409, resp.text


async def test_update_link_url_and_primary_together(async_client):
    """同一次调用里既换 url 又设主链接, 两条路径不能互相打架。"""
    tool = await create_tool(async_client, slug="t1", name="T1")
    old = await create_link(async_client, tool["id"], url="https://a.com", is_primary=True)
    new = await create_link(async_client, tool["id"], url="https://b.com")

    resp = await async_client.put(
        f"/api/v1/tools/{tool['id']}/links/{new['id']}",
        json={"url": "https://c.com", "is_primary": True},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_primary"] is True
    assert resp.json()["url"] == "https://c.com/"

    rows = {row.id: row for row in await _db_links(tool["id"])}
    assert rows[old["id"]].is_primary is False
    assert rows[new["id"]].is_primary is True
    assert rows[new["id"]].url == "https://c.com/"
    assert rows[new["id"]].url_hash == url_hash("https://c.com")
