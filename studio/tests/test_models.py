"""模型层业务规则守卫。"""

from app.models import (
    ACCESSES,
    LINK_LABELS,
    ORIGINS,
    PRICINGS,
    VALID_STATUS_TRANSITIONS,
    Access,
    LinkLabel,
    LinkStatus,
    Origin,
    Pricing,
    ToolStatus,
    TopicStatus,
)


def test_status_transitions_match_spec():
    """工具状态机: draft->pending, pending->draft/published, published->archived, archived->published。"""

    def values(target: ToolStatus) -> set[str]:
        return {status.value for status in VALID_STATUS_TRANSITIONS.get(target, set())}

    assert values(ToolStatus.DRAFT) == {"pending"}
    assert values(ToolStatus.PENDING) == {"draft", "published"}
    assert values(ToolStatus.PUBLISHED) == {"archived"}
    assert values(ToolStatus.ARCHIVED) == {"published"}


def test_draft_cannot_jump_to_published():
    """draft -> published 被明确排除: 必须先经过 pending。"""
    assert ToolStatus.PUBLISHED not in VALID_STATUS_TRANSITIONS[ToolStatus.DRAFT]
    assert ToolStatus.DRAFT not in VALID_STATUS_TRANSITIONS[ToolStatus.PUBLISHED]


def test_enums_are_str_enums_with_db_string_values():
    """枚举值就是库里的 ENUM 字符串, 不是 0/1/2 的魔法数字。"""
    assert TopicStatus.ACTIVE == "active"
    assert TopicStatus.DISABLED == "disabled"
    assert ToolStatus.DRAFT == "draft"
    assert ToolStatus.PENDING == "pending"
    assert ToolStatus.PUBLISHED == "published"
    assert ToolStatus.ARCHIVED == "archived"
    assert LinkStatus.ACTIVE == "active"
    assert LinkStatus.BROKEN == "broken"
    assert LinkStatus.DISABLED == "disabled"
    assert Pricing.FREE == "free"
    assert Origin.CN == "cn"
    assert Access.DIRECT == "direct"
    assert LinkLabel.WEBSITE == "website"


def test_value_tuples_match_enum_members():
    """模块级常量与枚举成员一一对应(schema 校验与 ORM 建表都靠它)。"""
    assert set(PRICINGS) == {"free", "freemium", "paid"}
    assert set(ORIGINS) == {"cn", "overseas"}
    assert set(ACCESSES) == {"direct", "proxy"}
    assert set(LINK_LABELS) == {"website", "api", "docs", "github", "playground", "pricing", "plugin", "other"}


def test_topic_and_tool_status_are_separate_enums():
    """三张表的 status 是三套互不相干的枚举, 值域不得互相串用。"""
    assert {status.value for status in TopicStatus} == {"disabled", "active"}
    assert {status.value for status in ToolStatus} == {"draft", "pending", "published", "archived"}
    assert {status.value for status in LinkStatus} == {"active", "broken", "disabled"}
