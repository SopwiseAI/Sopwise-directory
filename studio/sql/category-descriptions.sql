-- ============================================================================
-- 分类描述（sd_category.description）填充脚本
-- ----------------------------------------------------------------------------
-- 背景：
--   `sd_category.description` 字段一直存在（模型 / 建表语句 / CRUD API 都有），
--   但 `app/exporters/json_exporter.py` 从未把它写进导出 JSON，前端只能退回
--   「发现和浏览 X 类别的 AI 工具，XiGee 为你精选最佳选择」这一句模板 ——
--   二十个分类共用同一句式，SERP 摘要位等于浪费。
--
--   配套代码改动（同一分支）：
--     - studio: `_fetch_categories` 导出 `description`（空值不下发）
--     - web:    分类页 `generateMetadata` 优先用 `category.description`，
--               缺失时才回落到 `buildCategoryDescription()`
--
-- 执行方式（按环境选一条）：
--   mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < sql/category-descriptions.sql
--
-- 重要：
--   1. 本脚本只写数据库。前端要看到效果，必须再跑一次 **prod** 导出
--      （`APP_ENV=prod make export-prod`）—— 只有 prod 才会同步
--      `web/data/data.json`，dev/sit 只写 `data-{env}.json` 环境副本。
--   2. 幂等：全是按 slug 定位的 UPDATE，可重复执行。
--   3. 描述长度控制在 80–120 字，与 meta description 的展示宽度匹配。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 一、分类描述
-- ----------------------------------------------------------------------------
UPDATE sd_category SET description = '通用对话助手：用自然语言提问、写作、分析与编程。涵盖 ChatGPT、Claude、Gemini 等主流模型，也有 Kimi、DeepSeek 这类擅长长文本与推理的国内选择。' WHERE slug = 'chat-assistant';

UPDATE sd_category SET description = '文生图与图像编辑：从 Midjourney 的艺术化出图，到 Stable Diffusion、Flux 的开源自部署，以及 Ideogram 擅长的画面内文字渲染，可按出图风格与部署方式挑选。' WHERE slug = 'image-generation';

UPDATE sd_category SET description = 'AI 编程工具：代码补全、对话式改代码、用自然语言生成前端页面。既有 GitHub Copilot、Cursor 这类编辑器插件，也有 v0、Bolt.new 直接生成并部署应用的在线工具。' WHERE slug = 'code-tools';

UPDATE sd_category SET description = 'AI 写作与文案工具：语法校对、营销文案、博客与产品描述批量生成。Grammarly 偏校对与风格建议，Jasper、Copy.ai 等偏团队级营销内容生产。' WHERE slug = 'writing-tools';

UPDATE sd_category SET description = 'AI 视频生成与编辑：文生视频、图生视频、数字人播报与视频翻译。Runway、Pika、可灵 AI 侧重视频生成，HeyGen 擅长数字人口播与多语言配音。' WHERE slug = 'video-tools';

UPDATE sd_category SET description = 'AI 音频工具：文本转语音、语音克隆、音视频编辑与音乐生成。ElevenLabs、Murf AI 做配音，Descript 像改文档一样剪音视频，Suno、Udio 可直接按描述写歌。' WHERE slug = 'audio-tools';

UPDATE sd_category SET description = '效率与知识工具：AI 搜索、笔记写作、演示文稿生成与任务管理。Perplexity 给出带引用的答案，Notion AI 在文档里协作，Gamma 一键生成 PPT。' WHERE slug = 'productivity';

UPDATE sd_category SET description = 'AI 数据分析：自然语言查询、自动可视化、文本情感与分类。Julius AI、ChatGPT 数据分析适合上传表格直接提问，Tableau、Power BI 适合接企业数据源做报表。' WHERE slug = 'data-analysis';

UPDATE sd_category SET description = 'AI 设计工具：配色方案、界面原型、素材生成与设计协作。Khroma 学习你的偏好给出配色，Uizard 从草图生成原型，Figma AI、Canva AI 融入日常设计流程。' WHERE slug = 'design-tools';

UPDATE sd_category SET description = 'AI 教育学习：语言学习、个性化辅导、复习卡片与课程推荐。Duolingo 做语言练习，Khanmigo、松鼠 AI 提供自适应辅导，Quizlet AI 自动生成复习计划。' WHERE slug = 'education';

UPDATE sd_category SET description = 'AI 营销工具：SEO 内容优化、网站个性化与广告素材生成。Surfer SEO 按实时数据给写作建议，Mutiny 为不同访客生成转化文案，AdCreative.ai 批量产出广告创意。' WHERE slug = 'marketing';

UPDATE sd_category SET description = 'AI 翻译与本地化：文档翻译、双语对照阅读与团队协作交付。DeepL 以译文质量见长，沉浸式翻译在浏览器里做双语对照，Lokalise 面向开发团队的本地化流程。' WHERE slug = 'translation';

UPDATE sd_category SET description = 'AI 学术研究：文献检索、引用图谱、带引用的问答与综述辅助。Semantic Scholar 做引用分析，Consensus 从论文里给结论，Elicit 帮你梳理文献要点。' WHERE slug = 'research';

UPDATE sd_category SET description = '工作流自动化：连接多个应用、按触发器串起多步流程。Zapier 覆盖应用最广，Make 用可视化拖拽编排复杂场景，n8n 支持开源自托管与 AI 节点。' WHERE slug = 'automation';

UPDATE sd_category SET description = '客服与 Bot 平台：用自有知识库训练问答机器人，再嵌入网站或发布到多端。Chatbase 上传文档即可上线，Intercom Fin 接入企业知识库，Coze 支持插件与工作流。' WHERE slug = 'chatbot';

UPDATE sd_category SET description = 'AI 3D 生成：由文本或图片生成可用的三维模型，适配游戏与设计工作流。Meshy、Tripo 侧重快速出模与风格化，Luma Genie 基于神经渲染技术。' WHERE slug = '3d-tools';

UPDATE sd_category SET description = 'AI 法律工具：合同起草与审查、合规检索与法律研究。Spellbook 直接集成 Word 做条款审查，Harvey 面向律所处理合同、合规与研究任务。' WHERE slug = 'legal';

UPDATE sd_category SET description = 'AI 金融工具：记账与发票处理、财务报告自动化、个人预算管理。Docyt、Zeni 面向中小企业财务运营，Cleo 以对话方式帮个人管理预算与消费。' WHERE slug = 'finance';

UPDATE sd_category SET description = 'AI 医疗健康：症状评估、临床辅助与患者教育。Ada Health 引导用户判断就医时机，Glass Health 辅助起草诊疗计划，Hippocratic AI 面向护理与患者沟通。' WHERE slug = 'health';

UPDATE sd_category SET description = 'AI 游戏开发：生成风格化美术资产、打造有记忆与情感的 NPC。Scenario 产出游戏素材，Inworld AI、Convai 让 NPC 能自然对话甚至用语音交互。' WHERE slug = 'gaming';

-- ----------------------------------------------------------------------------
-- 二、校验：每个启用分类都应有描述，且长度落在 80–120 字
-- ----------------------------------------------------------------------------
SELECT slug,
       name,
       CHAR_LENGTH(description) AS desc_len
FROM sd_category
WHERE status = 1
ORDER BY (description IS NULL), slug;

SELECT COUNT(*) AS missing_description
FROM sd_category
WHERE status = 1
  AND (description IS NULL OR CHAR_LENGTH(TRIM(description)) = 0);


-- ============================================================================
-- 三、【可选，需与代码同批上线】chatbot 的 slug 更名
-- ----------------------------------------------------------------------------
-- 为什么建议改：
--   `chatbot` 这个 slug 读起来像「通用聊天机器人」，而它的 name 是「客服机器人」，
--   实际收录的是 Chatbase / Intercom Fin / Coze 这类客服与 Bot 搭建平台 ——
--   与 `chat-assistant`（对话助手）是**两个不同分类**，不存在重复收录问题
--   （早先误判为「关键词自相残杀」是只看英文 slug 得出的结论，已更正）。
--   改 slug 只是让 URL 与分类含义对齐，属于可选优化。
--
-- 注意：改 slug 会让 /category/chatbot 变成 404，必须同时加 301 重定向，
--       否则线上那条 URL 直接断链。顺序建议：
--         1) 先在 next.config.ts 的 redirects() 里加：
--              { source: "/category/chatbot", destination: "/category/support-bots", permanent: true }
--            但**不要**在数据改名之前部署 —— 否则 /category/chatbot 会 301 到一个还不存在的页面。
--         2) 本段 SQL 与上面的 redirect 同批上线。
--       如果不想处理这个时序，就保持现状，什么都不做。
-- ----------------------------------------------------------------------------
-- UPDATE sd_category SET slug = 'support-bots' WHERE slug = 'chatbot';
