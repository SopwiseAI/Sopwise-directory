"""ORM 模型 —— 与 studio/sql/schema.sql 一一对应(表前缀 xg_)。

改这里之前先读 schema.sql 的表头。要点:
  1. 枚举一律用 StrEnum,值就是 schema.sql 各列注释里的字符串(不是 0/1/2/3 的魔法数字);
     但【列本身是 VARCHAR 不是 ENUM】,映射方式见 _enum_column
  2. status 在 3 张表里是三套互不相干的枚举,别跨表复用同一个判断
  3. 导出 id 是 slug,不是这里的自增 id
  4. tags / languages 是 JSON 列(不是关联表);标签没有独立生命周期
  5. 工具与主题用【关联对象】而不是 secondary:is_primary / sort_order 是每条关系
     自己的属性,必须读得到(导出 topics[0] 靠它)
  6. "每个工具至多一个主主题 / 一个主链接"库里【没有任何约束】——schema.sql 已经删掉
     了 primary_slot_tool_id 生成列与它的唯一索引,全靠 app 保证。别写出"反正库会拦"
     的代码,也别再把这条当成能靠 500 兜住的事
"""

from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import (
    CHAR,
    JSON,
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# ── 枚举 ──────────────────────────────────────────────────────────────────────


class TopicStatus(StrEnum):
    DISABLED = "disabled"
    ACTIVE = "active"


class ToolStatus(StrEnum):
    DRAFT = "draft"
    PENDING = "pending"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class LinkStatus(StrEnum):
    ACTIVE = "active"
    BROKEN = "broken"
    DISABLED = "disabled"


class Pricing(StrEnum):
    FREE = "free"
    FREEMIUM = "freemium"
    PAID = "paid"


class Origin(StrEnum):
    CN = "cn"
    OVERSEAS = "overseas"


class Access(StrEnum):
    DIRECT = "direct"
    PROXY = "proxy"


class LinkLabel(StrEnum):
    WEBSITE = "website"
    API = "api"
    DOCS = "docs"
    GITHUB = "github"
    PLAYGROUND = "playground"
    PRICING = "pricing"
    PLUGIN = "plugin"
    OTHER = "other"


PRICINGS: tuple[str, ...] = tuple(p.value for p in Pricing)
ORIGINS: tuple[str, ...] = tuple(o.value for o in Origin)
ACCESSES: tuple[str, ...] = tuple(a.value for a in Access)
LINK_LABELS: tuple[str, ...] = tuple(label.value for label in LinkLabel)

# 工具状态迁移白名单。DRAFT→PUBLISHED 被禁止:必须经过 PENDING,
# 否则库里那个"待审核"就只是装饰。
VALID_STATUS_TRANSITIONS: dict[ToolStatus, set[ToolStatus]] = {
    ToolStatus.DRAFT: {ToolStatus.PENDING},
    ToolStatus.PENDING: {ToolStatus.DRAFT, ToolStatus.PUBLISHED},
    ToolStatus.PUBLISHED: {ToolStatus.ARCHIVED},
    ToolStatus.ARCHIVED: {ToolStatus.PUBLISHED},
}


def _enum_column(py_enum: type[StrEnum], name: str, length: int) -> SAEnum:
    """把 StrEnum 映射成 schema.sql 里的 VARCHAR 列(不是 MySQL 的 ENUM)。

    四个参数都不是可有可无的:
      native_enum=False  库里的值域列全是 VARCHAR。默认的 native_enum=True 会让 DDL
                         长出 ENUM(...),与 schema.sql 对不上;VARCHAR 也没有"加一个
                         值就要 ALTER TABLE"的迁移代价(5.7 / 8.0 行为一致)
      length             不给就按最长成员值推(如 pricing 推成 VARCHAR(8)),会和
                         schema.sql 的 VARCHAR(20) 对不上 —— 显式传,别依赖推断
      values_callable    SQLAlchemy 默认拿枚举【成员名】(FREE)当库值,必须换成成员值
      validate_strings   绑定裸字符串时也校验。库层已经没有 ENUM/CHECK 兜底了,
                         写错的值必须当场报错,而不是存进 VARCHAR 等读取时才炸

    读到枚举外的值是【读取时】报错:Enum 的结果处理器抛 LookupError,消息里带上非法值
    与允许值。这是刻意的 fail-closed —— 脏值不该静默流进导出产物。
    """
    return SAEnum(
        py_enum,
        name=name,
        native_enum=False,
        length=length,
        validate_strings=True,
        values_callable=lambda e: [m.value for m in e],
    )


# ── 表 ────────────────────────────────────────────────────────────────────────


class Topic(Base):
    """主题(导航骨架)。受控:20~30 个、扁平、不做层级。"""

    __tablename__ = "xg_topic"
    # 与 schema.sql 的键一一对应(模型不建表, 但这份声明是给对照用的唯一出处)
    __table_args__ = (
        UniqueConstraint("slug", name="uk_topic_slug"),
        UniqueConstraint("name", name="uk_topic_name"),
        Index("idx_topic_status_sort", "status", "sort_order"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    icon: Mapped[str] = mapped_column(String(64), nullable=False, server_default="Box")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    status: Mapped[TopicStatus] = mapped_column(
        _enum_column(TopicStatus, "topic_status", 16),
        nullable=False,
        server_default=TopicStatus.ACTIVE.value,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tool_topics: Mapped[list["ToolTopic"]] = relationship(back_populates="topic")


class Tool(Base):
    """工具(目录核心实体)。"""

    __tablename__ = "xg_tool"
    __table_args__ = (
        UniqueConstraint("slug", name="uk_tool_slug"),
        UniqueConstraint("name", name="uk_tool_name"),
        Index("idx_tool_status_sort", "status", "sort_order"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    tagline: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pricing: Mapped[Pricing] = mapped_column(_enum_column(Pricing, "tool_pricing", 20), nullable=False)
    is_open_source: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    origin: Mapped[Origin] = mapped_column(_enum_column(Origin, "tool_origin", 16), nullable=False)
    access: Mapped[Access] = mapped_column(_enum_column(Access, "tool_access", 16), nullable=False)
    last_access_check_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    languages: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    # 库里是 JSON DEFAULT NULL(NULL 视同空数组)。写入端总是给数组, 但直连改库留下的
    # NULL 行必须能读出来, 所以这里不能声明成 NOT NULL —— 导出/响应各自把 None 当 []
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    status: Mapped[ToolStatus] = mapped_column(
        _enum_column(ToolStatus, "tool_status", 16),
        nullable=False,
        server_default=ToolStatus.DRAFT.value,
    )
    last_updated_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tool_topics: Mapped[list["ToolTopic"]] = relationship(back_populates="tool", cascade="all, delete-orphan")
    links: Mapped[list["ToolLink"]] = relationship(back_populates="tool", cascade="all, delete-orphan")


class ToolTopic(Base):
    """工具-主题关联(N:M)。

    is_primary 是【每条关系自己的属性】——导出 topics[0] 就是它,绝不能靠
    Topic.sort_order 推导(否则工具的归属分节会随主题的全局排序漂移)。
    库里【只保证外键】,"至多一个主主题"没有任何约束兜底:写入端必须自己先取消旧的
    再设新的(见 app/api/v1/endpoints/tools.py 的三步走),别指望撞唯一索引报 500。
    """

    __tablename__ = "xg_tool_topic"
    __table_args__ = (Index("idx_tt_topic", "topic_id"),)

    tool_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("xg_tool.id", ondelete="CASCADE"), primary_key=True)
    topic_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("xg_topic.id", ondelete="RESTRICT"), primary_key=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tool: Mapped[Tool] = relationship(back_populates="tool_topics")
    topic: Mapped[Topic] = relationship(back_populates="tool_topics")


class ToolLink(Base):
    """工具链接(1:N)。url 存原始 URL,url_normalized 是导出直取的值,url_hash 是它的 SHA-256。"""

    __tablename__ = "xg_tool_link"
    # (tool_id, url_hash) 的唯一性写在 schema.sql 里, 写入端也靠它去重(见 tool_links.py);
    # 这里声明一份, 免得模型看过去像是"允许同一个工具挂两条相同 URL"
    __table_args__ = (
        UniqueConstraint("tool_id", "url_hash", name="uk_tl_url"),
        Index("idx_tl_tool", "tool_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tool_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("xg_tool.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    url_normalized: Mapped[str] = mapped_column(String(2048), nullable=False)
    # 定长十六进制:CHAR 而不是 VARCHAR, 与 schema.sql 一致
    url_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    label: Mapped[LinkLabel] = mapped_column(
        _enum_column(LinkLabel, "tool_link_label", 20),
        nullable=False,
        server_default=LinkLabel.OTHER.value,
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    status: Mapped[LinkStatus] = mapped_column(
        _enum_column(LinkStatus, "tool_link_status", 16),
        nullable=False,
        server_default=LinkStatus.ACTIVE.value,
    )
    last_link_check_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tool: Mapped[Tool] = relationship(back_populates="links")
