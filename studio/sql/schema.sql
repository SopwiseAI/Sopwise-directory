-- ============================================================================
-- Sopwise Directory · 数据库表结构
-- ----------------------------------------------------------------------------
-- 表清单:
--   sd_category        分类表（导航骨架，1:N → 产品）
--   sd_product         产品主表（目录核心实体）
--   sd_product_link    产品链接表（1:N，主站/API/文档/GitHub 等）
--   sd_tag             标签表（独立管理，去重/统计）
--   sd_product_tag     产品-标签关联表（N:M）
--
-- 表关系:
--   sd_category   1──N sd_product           (category_id FK, ON DELETE SET NULL)
--   sd_product    1──N sd_product_link      (product_id FK, ON DELETE CASCADE)
--   sd_product    N──M sd_tag               (sd_product_tag 中间表, ON DELETE CASCADE)
--
-- 约定:
--   1. 主键为 BIGINT AUTO_INCREMENT，业务标识用 slug（UNIQUE）
--   2. status: 0=草稿 1=待审核 2=已发布 3=已下架（仅 status=2 导出）
--   3. 软删除不用，靠 status 管理
--   4. 审计字段: created_at / updated_at / published_at
--   5. 分类产品数不冗余存储，用查询实时统计
--   6. 链接唯一性通过 url_hash 保证，归一化规则见 sd_product_link 注释
--   7. is_primary（每个产品至多一个主链接）由应用层保证，MySQL 不支持条件唯一索引
--   8. 引擎 InnoDB, 字符集 utf8mb4
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1、分类表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_category (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(64)  NOT NULL              COMMENT 'URL 友好标识（如 chat-assistant）',
  name        VARCHAR(64)  NOT NULL              COMMENT '分类名称（如：对话助手）',
  icon        VARCHAR(64)  NOT NULL              COMMENT 'Lucide 图标名（如 MessageSquare）',
  description VARCHAR(500) DEFAULT NULL          COMMENT '分类描述（不导出）',
  sort_order  INT          NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前）',
  status      TINYINT      NOT NULL DEFAULT 1    COMMENT '0=禁用 1=启用',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  UNIQUE KEY uk_name (name),
  KEY idx_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';


-- ----------------------------------------------------------------------------
-- 2、产品主表
--    published_at: 审核通过发布（status→2）时写入，之后不再变（除非下架后重新发布）
--    前端"最新"排序使用 published_at DESC，而非 created_at / updated_at
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(64)  NOT NULL              COMMENT '业务标识（如 zapier），可改不影响关联',
  name         VARCHAR(128) NOT NULL              COMMENT '产品名称',
  description  VARCHAR(500) DEFAULT NULL          COMMENT '产品描述（可空，后续 AI 填充）',
  category_id  BIGINT       DEFAULT NULL          COMMENT '所属分类 ID（NULL=未分类）',
  pricing      VARCHAR(20)  NOT NULL DEFAULT 'free' COMMENT 'free/freemium/paid/opensource',
  featured     TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否精选',
  sort_order   INT          NOT NULL DEFAULT 0    COMMENT '排序权重（精选列表内排序）',
  status       TINYINT      NOT NULL DEFAULT 0    COMMENT '0=草稿 1=待审核 2=已发布 3=已下架',
  published_at DATETIME     DEFAULT NULL          COMMENT '首次发布时间（前端"最新"排序依据，NULL=从未发布）',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  UNIQUE KEY uk_name (name),
  KEY idx_category (category_id),
  KEY idx_status_sort (status, sort_order),
  KEY idx_featured (featured),
  KEY idx_published_at (published_at),
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES sd_category (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品主表';


-- ----------------------------------------------------------------------------
-- 3、产品链接表（1:N，一个产品多个链接）
--
-- URL 归一化规则（应用层实现，hash 基于归一化后的 URL 计算）:
--   1. 强制 https（http:// → https://）
--   2. 域名转小写
--   3. 去掉 www. 前缀
--   4. 去掉默认端口（:443 / :80）
--   5. 去掉尾部 /（根路径除外）
--   6. 去掉 fragment（#...）
--   示例: http://www.Example.com:443/foo/#top → https://example.com/foo
--
-- url 列存原始 URL（用户输入的完整地址），url_hash 存归一化后 SHA-256
-- is_primary 唯一性由应用层保证（每个产品至多一个 is_primary=1 的链接）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product_link (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  product_id  BIGINT       NOT NULL              COMMENT '所属产品 ID',
  url         VARCHAR(2048) NOT NULL             COMMENT '链接地址（原始 URL，完整保留）',
  url_hash    CHAR(64)     NOT NULL              COMMENT 'SHA-256(归一化URL)，用于全局唯一约束',
  label       VARCHAR(32)  DEFAULT NULL          COMMENT '链接标签（主站/API/文档/GitHub 等）',
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否主链接（每个产品至多一个，应用层保证）',
  sort_order  INT          NOT NULL DEFAULT 0    COMMENT '排序权重',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_url_hash (url_hash),
  KEY idx_product (product_id),
  KEY idx_product_primary (product_id, is_primary),
  CONSTRAINT fk_link_product FOREIGN KEY (product_id) REFERENCES sd_product (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品链接表';


-- ----------------------------------------------------------------------------
-- 4、标签表（独立管理，支持去重/统计）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_tag (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(64)  NOT NULL              COMMENT '标签标识（如 free、api、chinese）',
  name        VARCHAR(64)  NOT NULL              COMMENT '标签显示名（如 免费、API、中文）',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';


-- ----------------------------------------------------------------------------
-- 5、产品-标签关联表（N:M）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product_tag (
  product_id  BIGINT       NOT NULL,
  tag_id      BIGINT       NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, tag_id),
  KEY idx_tag (tag_id),
  CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES sd_product (id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES sd_tag (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品-标签关联表';
