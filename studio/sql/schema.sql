-- ============================================================================
-- XiGee · 数据库表结构
-- ----------------------------------------------------------------------------
-- 设计原则：【库只做存储，业务规则放应用层】
--   不用 CHECK、不用生成列、不用 ENUM —— 前两者在 MySQL 5.7 上要么静默失效、
--   要么建不出来；ENUM 每加一个值都要 ALTER TABLE，不利于迁移。
--   值域一律由 app 侧的 StrEnum + Pydantic 保证（见 app/models、app/schemas）。
--
-- 目标库：dev 是 MySQL 5.7、prod 是 8.0，所以只用两边都支持的写法。
--
-- 表清单:
--   xg_topic        主题表（导航骨架）
--   xg_tool         工具主表
--   xg_tool_topic   工具-主题关联表（N:M）
--   xg_tool_link    工具链接表（1:N）
--
-- 表关系:
--   xg_tool N──M xg_topic      (xg_tool_topic；删工具 CASCADE，删主题 RESTRICT)
--   xg_tool 1──N xg_tool_link  (tool_id；删工具 CASCADE)
--
-- 导出投影（导出端按此取数；字段形状见 studio/schema/*.data.jsonc）:
--   topics[]  WHERE status='active'  ORDER BY sort_order DESC, id ASC
--             id 取 slug；toolCount 由导出端按最终的 tools[] 就地聚合
--   tools[]   WHERE status='published' AND 存在 status='active' 的链接
--             ORDER BY sort_order DESC, published_at DESC, id ASC
--             url      ← 主链接的 url（库里已是归一化值；取不到则回退首个 active 链接）
--             topics[] ← xg_topic.slug（【不是】topic_id）；首个即主主题（is_primary=1）
--             links[]  ← 非主链接且 active，且排除已被选作 url 的那一条
--             publishedAt   ← 日期列 published_at（可空；NULL 时省略键）
--             lastUpdatedAt ← 审计列 updated_at 的日期部分（改库时间；NOT NULL 所以【永远存在】）
--                             它【不是】工具自身在上游的更新日期——那个字段没有消费者，已删
--             无有效主题时 topics 回退 ['misc']
--   可空字段为 NULL 时【省略该键】，不输出 null
--
-- 约定:
--   1. 对外标识用 slug（UNIQUE），发布后不改。导出 id 是 slug，不是自增 id
--   2. status / pricing / origin / access / label 都是 VARCHAR，取值见各列注释，
--      由 app 侧枚举校验 —— 加值不需要任何 DDL
--   3. 不用软删除，靠 status 管理
--   4. 【每个工具至多一个主主题 / 一个主链接】由 app 保证（库层不放哨兵列）
--   5. 计数不冗余存储（主题下的工具数由导出端实时聚合）
--   6. 字符集 utf8mb4 / utf8mb4_general_ci（5.7 与 8.0 都有）
--   7. 时间列用 DATETIME + CURRENT_TIMESTAMP，取【服务器会话时区】，不是 UTC
--   8. 索引只留真实访问路径；数据量上来后再按需加
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1、主题表（导航骨架）
--    受控：保持 20~30 个、扁平、不做层级。少于 3 个工具的主题应降级为 tag。
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xg_topic (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(64)  NOT NULL              COMMENT '主题标识（kebab-case）；对外主键',
  name        VARCHAR(64)  NOT NULL              COMMENT '主题显示名（如 对话）',
  icon        VARCHAR(64)  NOT NULL DEFAULT 'Box' COMMENT 'Lucide 图标组件名（PascalCase）',
  description VARCHAR(500) DEFAULT NULL          COMMENT '主题简介（可空；NULL 时导出省略该键）',
  sort_order  INT          NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前）；决定 topics 数组顺序',
  status      VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT 'disabled | active；仅 active 导出',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_topic_slug (slug),
  UNIQUE KEY uk_topic_name (name),
  KEY idx_topic_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='主题表（导航骨架）';


-- ----------------------------------------------------------------------------
-- 2、工具主表
--    tagline   卡片唯一展示的文案，也用于导出 awesome 风格清单。
--              注意 awesome-lint 只认 ASCII 的 . ! ? …，中文句号「。」
--              要在生成清单那一步转换；站内中文文案保持中文标点。
--    pricing   与 is_open_source 是【两根正交的轴】：前者说怎么收费，
--              后者说源码是否开放。开源工具同样可以有付费的云托管版。
--    languages 界面支持语言，ISO 639-1 数组，首项为主语言（位置即语义）。
--    tags      标签数组，最多 8 个；展示/检索用，无受控词表。
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xg_tool (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  slug                 VARCHAR(64)  NOT NULL              COMMENT '工具标识（如 deepseek）；对外主键，发布后不改',
  name                 VARCHAR(128) NOT NULL              COMMENT '工具名称（如 DeepSeek）',
  tagline              VARCHAR(80)  NOT NULL              COMMENT '一句话简介（卡片唯一展示文案，句末带标点）',
  description          VARCHAR(500) DEFAULT NULL          COMMENT '较长补充说明（可空；NULL 时导出省略该键）',
  pricing              VARCHAR(20)  NOT NULL              COMMENT 'free | freemium | paid；不给默认值，必须显式写入',
  is_open_source       TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '源码是否开放（与 pricing 正交）',
  origin               VARCHAR(16)  NOT NULL              COMMENT 'cn=国产 overseas=海外；不给默认值',
  access               VARCHAR(16)  NOT NULL              COMMENT 'direct=可直连 proxy=需代理（含打开/注册/登录/支付全链路）；不给默认值',
  last_access_check_at DATE         DEFAULT NULL          COMMENT '上次 access 复检日期（NULL=从未复检）；不导出',
  languages            JSON         NOT NULL              COMMENT '界面支持语言，如 ["zh","en"]，至少 1 项，首项为主语言',
  tags                 JSON         DEFAULT NULL          COMMENT '标签数组，如 ["ds","开源"]，最多 8 个；NULL 视同空数组',
  is_featured          TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否精选',
  sort_order           INT          NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前）；决定 tools 数组顺序',
  status               VARCHAR(16)  NOT NULL DEFAULT 'draft' COMMENT 'draft | pending | published | archived；仅 published 导出',
  published_at         DATE         DEFAULT NULL          COMMENT '收录进本站的日期（首次转为 published 时写入一次）',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间（审计，不导出）',
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_tool_slug (slug),
  UNIQUE KEY uk_tool_name (name),
  KEY idx_tool_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工具主表';


-- ----------------------------------------------------------------------------
-- 3、工具-主题关联表（N:M）
--    is_primary 标记主主题，每个工具至多一个【由 app 保证】：
--      - 导出投影里 topics[0] 就是它
--      - 导出 awesome 风格清单时，每个工具只在主主题下出现一次
--        （awesome-lint 的 double-link 不允许同一条链接出现两次）
--    主主题是【每条关系自己的属性】，不能靠 xg_topic.sort_order 推导，
--    否则工具的归属分节会随主题的全局排序漂移。
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xg_tool_topic (
  tool_id    BIGINT     NOT NULL              COMMENT '工具 id',
  topic_id   BIGINT     NOT NULL              COMMENT '主题 id',
  is_primary TINYINT(1) NOT NULL DEFAULT 0    COMMENT '是否主主题（每个工具至多一个，app 保证）',
  sort_order INT        NOT NULL DEFAULT 0    COMMENT '同一工具内的主题展示顺序（越大越靠前）',
  created_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新；改主主题时可追查漂移',
  PRIMARY KEY (tool_id, topic_id),
  KEY idx_tt_topic (topic_id),
  CONSTRAINT fk_tt_tool  FOREIGN KEY (tool_id)  REFERENCES xg_tool (id)  ON DELETE CASCADE,
  CONSTRAINT fk_tt_topic FOREIGN KEY (topic_id) REFERENCES xg_topic (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工具-主题关联表';


-- ----------------------------------------------------------------------------
-- 4、工具链接表（1:N）
--    url            【已归一化】的链接。写入端落库前调一次 normalize_url()，
--                   库里不保留用户输入的原始串 —— 唯一键认的是归一化结果，
--                   导出也直接取它，"原始串"没有任何消费者（要求见 app/utils/url.py
--                   的 11 条规则；写入端在 app/api/v1/endpoints/tools.py）
--    url_hash       SHA-256(url)，用于工具内去重
--                   长 URL 无法直接建唯一索引（utf8mb4 下 2048 字符超出键长上限），故用 hash
--    is_primary     每个工具至多一个【由 app 保证】；导出为 tools[].url
--                   注意主链接那一行的 label 不导出（links[] 只取非主链接）
--    status         active | broken | disabled；仅 active 导出
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xg_tool_link (
  id                 BIGINT        NOT NULL AUTO_INCREMENT,
  tool_id            BIGINT        NOT NULL              COMMENT '所属工具 id',
  url                VARCHAR(2048) NOT NULL              COMMENT '已归一化的 URL（写入端保证；导出直接取用）',
  url_hash           CHAR(64)      NOT NULL              COMMENT 'SHA-256(url)，十六进制',
  label              VARCHAR(20)   NOT NULL DEFAULT 'other' COMMENT 'website | api | docs | github | playground | pricing | plugin | other',
  is_primary         TINYINT(1)    NOT NULL DEFAULT 0    COMMENT '是否主链接（每个工具至多一个，app 保证）',
  status             VARCHAR(16)   NOT NULL DEFAULT 'active' COMMENT 'active | broken | disabled；仅 active 导出',
  last_link_check_at DATETIME      DEFAULT NULL          COMMENT '上次链接检测时间（NULL=从未检测）',
  sort_order         INT           NOT NULL DEFAULT 0    COMMENT '排序权重（越大越靠前）；决定 links 数组顺序',
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
  PRIMARY KEY (id),
  UNIQUE KEY uk_tl_url (tool_id, url_hash),
  KEY idx_tl_tool (tool_id),
  CONSTRAINT fk_tl_tool FOREIGN KEY (tool_id) REFERENCES xg_tool (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工具链接表';


-- ----------------------------------------------------------------------------
-- 5、种子数据：未分类主题（幂等，可重复执行）
--    工具没有有效主题时，导出端会回退到 misc「未分类」。所以它必须是一条真实行，
--    而且不能被禁用（status='disabled' 后就不再导出，回退工具会指向不存在的 id）。
--    注意：xg_topic.name 也有唯一键，若库里已存在另一个 name='未分类' 的行，
--    这条 INSERT 会撞 uk_topic_name 报 1062 —— 那是需要人工介入的情况，别静默吞掉。
-- ----------------------------------------------------------------------------
INSERT INTO xg_topic (slug, name, icon, description, sort_order, status)
SELECT 'misc', '未分类', 'Box', '尚未归类的工具，等待整理到合适的主题下。', -1, 'active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM xg_topic WHERE slug = 'misc') AS t);

UPDATE xg_topic SET status = 'active' WHERE slug = 'misc' AND status <> 'active';
