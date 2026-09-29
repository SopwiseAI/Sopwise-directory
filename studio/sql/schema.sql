-- ============================================================================
-- Sopwise Directory · 数据库表结构
-- ----------------------------------------------------------------------------
-- 表清单:
--   sd_category          分类表（导航骨架）
--   sd_product           产品主表（目录核心实体）
--   sd_product_category  产品-分类关联表（N:M）
--   sd_product_link      产品链接表（1:N，主站/API/文档/GitHub 等）
--   sd_tag               标签表（独立管理，去重/统计）
--   sd_product_tag       产品-标签关联表（N:M）
--
-- 表关系:
--   sd_product    N──M sd_category        (sd_product_category 中间表, ON DELETE CASCADE)
--   sd_product    1──N sd_product_link    (product_id FK, ON DELETE CASCADE)
--   sd_product    N──M sd_tag             (sd_product_tag 中间表, ON DELETE CASCADE)
--
-- 约定:
--   1. 主键为 BIGINT AUTO_INCREMENT，业务标识用 slug（UNIQUE）
--   2. status: 0=草稿 1=待审核 2=已发布 3=已下架（仅 status=2 导出）
--   3. 软删除不用，靠 status 管理
--   4. 审计字段: created_at / updated_at / published_at
--   5. 分类产品数不冗余存储，用查询实时统计
--   6. 链接唯一性通过 url_hash 保证，归一化规则见 sd_product_link 注释
--   7. is_primary（每个产品至多一个主链接）由应用层保证，索引 (product_id, is_primary) 用于查询加速
--   8. 链接状态: 1=正常 2=已失效 3=手动禁用（仅 status=1 导出）
--   9. 引擎 InnoDB, 字符集 utf8mb4
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1、分类表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_category (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(64)  NOT NULL              COMMENT 'URL 友好标识（如 chat-assistant）',
  name        VARCHAR(64)  NOT NULL              COMMENT '分类名称（如：对话助手）',
  icon        VARCHAR(64)  DEFAULT NULL          COMMENT 'Lucide 图标名（如 MessageSquare，为空时前端显示占位图标）',
  description VARCHAR(500) DEFAULT NULL          COMMENT '分类描述',
  sort_order  INT          NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前）',
  status      TINYINT      NOT NULL DEFAULT 1    COMMENT '0=禁用 1=启用',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  UNIQUE KEY uk_name (name),
  KEY idx_status_sort (status, sort_order)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COMMENT='分类表';


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
  pricing      VARCHAR(20)  NOT NULL DEFAULT 'free' COMMENT 'free/freemium/paid/opensource',
  featured     TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否精选',
  sort_order   INT          NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前，导出排序用）',
  status       TINYINT      NOT NULL DEFAULT 0    COMMENT '0=草稿 1=待审核 2=已发布 3=已下架',
  published_at DATETIME     DEFAULT NULL          COMMENT '首次发布时间（前端"最新"排序依据，NULL=从未发布）',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  UNIQUE KEY uk_name (name),
  KEY idx_status_sort (status, sort_order),
  KEY idx_featured (featured),
  KEY idx_published_at (published_at)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COMMENT='产品主表';


-- ----------------------------------------------------------------------------
-- 3、产品-分类关联表（N:M，一个产品可属于多个分类）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product_category (
  product_id  BIGINT       NOT NULL              COMMENT '关联产品 ID',
  category_id BIGINT       NOT NULL              COMMENT '关联分类 ID',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (product_id, category_id),
  KEY idx_category (category_id),
  CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES sd_product (id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES sd_category (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品-分类关联表';


-- ----------------------------------------------------------------------------
-- 4、产品链接表（1:N，一个产品多个链接）
--
-- URL 归一化规则（应用层实现，hash 基于归一化后的 URL 计算）:
--   1. 强制 https（localhost/127.0.0.1/::1/0.0.0.0 → http）
--   2. 域名转小写
--   3. 去掉 www. 前缀
--   4. 去掉默认端口（:443 / :80），其余端口保留
--   5. 去掉尾部 /（根路径除外）
--   6. 去掉 fragment（#...）
--   7. 去掉 userinfo（user:pass@ 前缀）
--   8. 解析 dot-segment（/a/../b → /b）
--   9. 归一化 percent-encoding（%7E → ~，%2f → %2F）
--  10. 折叠多斜杠（//foo → /foo）
--  11. query 参数排序
--  (7-10 及 IPv6 方括号由 url-normalize 库处理)
-- 示例: http://www.Example.com:443/foo/#top → https://example.com/foo
--
-- url 列存原始 URL（用户输入的完整地址），url_hash 存归一化后 SHA-256
-- is_primary 唯一性由应用层保证（每个产品至多一个 is_primary=1）
-- status: 1=正常 2=已失效 3=手动禁用（仅 status=1 导出到前端）
-- last_checked_at: 上次链接检测时间（NULL=从未检测）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product_link (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  product_id  BIGINT       NOT NULL              COMMENT '所属产品 ID',
  url         VARCHAR(2048) NOT NULL             COMMENT '链接地址（原始 URL，完整保留）',
  url_hash    CHAR(64)     NOT NULL              COMMENT 'SHA-256(归一化URL)，用于产品内唯一约束',
  label       VARCHAR(64)  DEFAULT NULL          COMMENT '链接标签：Website API Docs GitHub Playground Pricing Plugin Other',
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否主链接（每个产品至多一个，应用层保证）',
  status      TINYINT      NOT NULL DEFAULT 1    COMMENT '1=正常 2=已失效 3=手动禁用',
  last_checked_at DATETIME DEFAULT NULL           COMMENT '上次链接检测时间',
  sort_order  INT          NOT NULL DEFAULT 0    COMMENT '排序权重',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_url (product_id, url_hash),
  KEY idx_product (product_id),
  KEY idx_product_primary (product_id, is_primary),
  KEY idx_product_sort (product_id, sort_order),
  KEY idx_status (status)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COMMENT='产品链接表';


-- ----------------------------------------------------------------------------
-- 5、标签表（独立管理，支持去重/统计）
--    sort_order: 排序权重（前端筛选栏/标签云展示顺序，越大越靠前）
--    status: 0=禁用 1=启用（禁用标签保留关联但不导出到前端）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_tag (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(64)  NOT NULL              COMMENT '标签标识（如 free、api、chinese）',
  name        VARCHAR(64)  NOT NULL              COMMENT '标签显示名（如 免费、API、中文）',
  sort_order  INT          NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前）',
  status      TINYINT      NOT NULL DEFAULT 1    COMMENT '0=禁用 1=启用',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  UNIQUE KEY uk_name (name),
  KEY idx_status_sort (status, sort_order)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COMMENT='标签表';


-- ----------------------------------------------------------------------------
-- 6、产品-标签关联表（N:M）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product_tag (
  product_id  BIGINT       NOT NULL              COMMENT '关联产品 ID',
  tag_id      BIGINT       NOT NULL              COMMENT '关联标签 ID',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (product_id, tag_id),
  KEY idx_tag (tag_id),
  CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES sd_product (id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES sd_tag (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品-标签关联表';


-- ----------------------------------------------------------------------------
-- 7、产品关联表（产品间关联，如相似/替代/升级/配套）
--    relation_type: similar=同类 similar=替代 upgrade=升级 complementary=配套
--    不自创建反向关联，查询时通过 idx_related 反查
--    ON DELETE CASCADE 确保产品删除时关联自动清理
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_product_relation (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  product_id     BIGINT       NOT NULL              COMMENT '源产品 ID',
  related_id     BIGINT       NOT NULL              COMMENT '关联产品 ID',
  relation_type  VARCHAR(16)  NOT NULL              COMMENT '关联类型：similar alternative upgrade complementary',
  sort_order     INT          NOT NULL DEFAULT 0    COMMENT '排序权重',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_relation (product_id, related_id, relation_type),
  KEY idx_product (product_id),
  KEY idx_related (related_id),
  KEY idx_type (relation_type),
  CONSTRAINT fk_pr_product FOREIGN KEY (product_id) REFERENCES sd_product (id) ON DELETE CASCADE,
  CONSTRAINT fk_pr_related FOREIGN KEY (related_id) REFERENCES sd_product (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COMMENT='产品关联表';

