"""initial schema

Revision ID: 9524a7f90a7d
Revises:
Create Date: 2026-09-24 14:10:58.897673

Creates the 5 sd_* tables. Database already has these tables (created by sql/schema.sql);
this migration is stamped against the existing schema to establish version tracking.

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import mysql

from alembic import op

revision: str = "9524a7f90a7d"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sd_category",
        sa.Column("id", mysql.BIGINT(display_width=20), autoincrement=True, nullable=False),
        sa.Column("slug", mysql.VARCHAR(length=64), nullable=False, comment="URL 友好标识"),
        sa.Column("name", mysql.VARCHAR(length=64), nullable=False, comment="分类名称"),
        sa.Column("icon", mysql.VARCHAR(length=64), nullable=False, comment="Lucide 图标名"),
        sa.Column("description", mysql.VARCHAR(length=500), nullable=True, comment="分类描述"),
        sa.Column(
            "sort_order",
            mysql.INTEGER(display_width=11),
            server_default=sa.text("'0'"),
            autoincrement=False,
            nullable=False,
            comment="排序权重",
        ),
        sa.Column(
            "status",
            mysql.TINYINT(display_width=4),
            server_default=sa.text("'1'"),
            autoincrement=False,
            nullable=False,
            comment="0=禁用 1=启用",
        ),
        sa.Column("created_at", mysql.DATETIME(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column(
            "updated_at",
            mysql.DATETIME(),
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        comment="分类表",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.create_index(op.f("uk_slug"), "sd_category", ["slug"], unique=True)
    op.create_index(op.f("uk_name"), "sd_category", ["name"], unique=True)
    op.create_index(op.f("idx_status_sort"), "sd_category", ["status", "sort_order"], unique=False)

    op.create_table(
        "sd_product",
        sa.Column("id", mysql.BIGINT(display_width=20), autoincrement=True, nullable=False),
        sa.Column("slug", mysql.VARCHAR(length=64), nullable=False, comment="业务标识"),
        sa.Column("name", mysql.VARCHAR(length=128), nullable=False, comment="产品名称"),
        sa.Column("description", mysql.VARCHAR(length=500), nullable=True, comment="产品描述"),
        sa.Column(
            "category_id",
            mysql.BIGINT(display_width=20),
            autoincrement=False,
            nullable=True,
            comment="所属分类 ID",
        ),
        sa.Column(
            "pricing",
            mysql.VARCHAR(length=20),
            server_default=sa.text("'free'"),
            nullable=False,
            comment="free/freemium/paid/opensource",
        ),
        sa.Column(
            "featured",
            mysql.TINYINT(display_width=1),
            server_default=sa.text("'0'"),
            autoincrement=False,
            nullable=False,
            comment="是否精选",
        ),
        sa.Column(
            "sort_order",
            mysql.INTEGER(display_width=11),
            server_default=sa.text("'0'"),
            autoincrement=False,
            nullable=False,
            comment="排序权重",
        ),
        sa.Column(
            "status",
            mysql.TINYINT(display_width=4),
            server_default=sa.text("'0'"),
            autoincrement=False,
            nullable=False,
            comment="0=草稿 1=待审核 2=已发布 3=已下架",
        ),
        sa.Column("published_at", mysql.DATETIME(), nullable=True, comment="首次发布时间"),
        sa.Column("created_at", mysql.DATETIME(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column(
            "updated_at",
            mysql.DATETIME(),
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["category_id"], ["sd_category.id"], name=op.f("fk_product_category"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        comment="产品主表",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.create_index(op.f("uk_slug"), "sd_product", ["slug"], unique=True)
    op.create_index(op.f("uk_name"), "sd_product", ["name"], unique=True)
    op.create_index(op.f("idx_category"), "sd_product", ["category_id"], unique=False)
    op.create_index(op.f("idx_status_sort"), "sd_product", ["status", "sort_order"], unique=False)
    op.create_index(op.f("idx_featured"), "sd_product", ["featured"], unique=False)
    op.create_index(op.f("idx_published_at"), "sd_product", ["published_at"], unique=False)

    op.create_table(
        "sd_product_link",
        sa.Column("id", mysql.BIGINT(display_width=20), autoincrement=True, nullable=False),
        sa.Column(
            "product_id", mysql.BIGINT(display_width=20), autoincrement=False, nullable=False, comment="所属产品 ID"
        ),
        sa.Column("url", mysql.VARCHAR(length=2048), nullable=False, comment="链接地址"),
        sa.Column("url_hash", mysql.CHAR(length=64), nullable=False, comment="SHA-256(归一化URL)"),
        sa.Column("label", mysql.VARCHAR(length=32), nullable=True, comment="链接标签"),
        sa.Column(
            "is_primary",
            mysql.TINYINT(display_width=1),
            server_default=sa.text("'0'"),
            autoincrement=False,
            nullable=False,
            comment="是否主链接",
        ),
        sa.Column(
            "sort_order",
            mysql.INTEGER(display_width=11),
            server_default=sa.text("'0'"),
            autoincrement=False,
            nullable=False,
            comment="排序权重",
        ),
        sa.Column("created_at", mysql.DATETIME(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column(
            "updated_at",
            mysql.DATETIME(),
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["product_id"], ["sd_product.id"], name=op.f("fk_link_product"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        comment="产品链接表",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.create_index(op.f("uk_url_hash"), "sd_product_link", ["url_hash"], unique=True)
    op.create_index(op.f("idx_product"), "sd_product_link", ["product_id"], unique=False)
    op.create_index(op.f("idx_product_primary"), "sd_product_link", ["product_id", "is_primary"], unique=False)

    op.create_table(
        "sd_tag",
        sa.Column("id", mysql.BIGINT(display_width=20), autoincrement=True, nullable=False),
        sa.Column("slug", mysql.VARCHAR(length=64), nullable=False, comment="标签标识"),
        sa.Column("name", mysql.VARCHAR(length=64), nullable=False, comment="标签显示名"),
        sa.Column("created_at", mysql.DATETIME(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        comment="标签表",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.create_index(op.f("uk_slug"), "sd_tag", ["slug"], unique=True)
    op.create_index(op.f("uk_name"), "sd_tag", ["name"], unique=True)

    op.create_table(
        "sd_product_tag",
        sa.Column("product_id", mysql.BIGINT(display_width=20), autoincrement=False, nullable=False),
        sa.Column("tag_id", mysql.BIGINT(display_width=20), autoincrement=False, nullable=False),
        sa.Column("created_at", mysql.DATETIME(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["sd_product.id"], name=op.f("fk_pt_product"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["sd_tag.id"], name=op.f("fk_pt_tag"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("product_id", "tag_id"),
        comment="产品-标签关联表",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.create_index(op.f("idx_tag"), "sd_product_tag", ["tag_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("idx_tag"), table_name="sd_product_tag")
    op.drop_table("sd_product_tag")
    op.drop_index(op.f("uk_name"), table_name="sd_tag")
    op.drop_index(op.f("uk_slug"), table_name="sd_tag")
    op.drop_table("sd_tag")
    op.drop_index(op.f("idx_product_primary"), table_name="sd_product_link")
    op.drop_index(op.f("idx_product"), table_name="sd_product_link")
    op.drop_index(op.f("uk_url_hash"), table_name="sd_product_link")
    op.drop_table("sd_product_link")
    op.drop_index(op.f("idx_published_at"), table_name="sd_product")
    op.drop_index(op.f("idx_featured"), table_name="sd_product")
    op.drop_index(op.f("idx_status_sort"), table_name="sd_product")
    op.drop_index(op.f("idx_category"), table_name="sd_product")
    op.drop_index(op.f("uk_name"), table_name="sd_product")
    op.drop_index(op.f("uk_slug"), table_name="sd_product")
    op.drop_table("sd_product")
    op.drop_index(op.f("idx_status_sort"), table_name="sd_category")
    op.drop_index(op.f("uk_name"), table_name="sd_category")
    op.drop_index(op.f("uk_slug"), table_name="sd_category")
    op.drop_table("sd_category")
