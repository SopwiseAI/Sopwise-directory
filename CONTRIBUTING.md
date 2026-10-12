# 贡献指南

## 项目结构

```
web/        前端 (Next.js + pnpm)
studio/     后端 (FastAPI + uv)
skills/     AI 套件 (Python CLI + prompts)
scripts/    开发脚本
.opencode/  opencode 命令和 Agent 规则
```

## 开发环境

```bash
# 安装根工程化依赖
pnpm install

# 安装各模块依赖
./scripts/install.sh

# 启动开发服务
./scripts/dev.sh          # 前端 + 后端
./scripts/dev-web.sh      # 仅前端 (port 3000)
./scripts/dev-studio.sh   # 仅后端 (port 8000)
```

## 环境变量

按目标环境复制模板（studio 按 `APP_ENV` 加载对应文件，**默认 dev → `.env.dev`**；不存在无后缀的 `.env`）：

```bash
cp studio/.env.example studio/.env.dev   # 开发（默认，APP_ENV=dev）
cp studio/.env.example studio/.env.sit   # SIT（APP_ENV=sit）
cp studio/.env.example studio/.env.prod  # 生产（APP_ENV=prod）
```

各模块按需配置对应环境变量。`scripts/mcp-mysql.sh` 读取的也是同一套 `studio/.env.<env>` 文件。

## 代码规范

### 分支命名

```
feat/<name>      新功能
fix/<name>       缺陷修复
refactor/<name>  重构
chore/<name>     工程化/工具链变更
docs/<name>      文档
data/<name>      数据同步（唯一允许提交 web/data/data.json 的功能分支）
```

### 提交规范 (Conventional Commits)

```
<type>(<scope>): <subject>

feat: 新功能
fix: 修复 bug
docs: 文档
style: 格式调整
refactor: 重构
perf: 性能优化
test: 测试
build: 构建系统
ci: CI 配置
chore: 构建/工具
revert: 回退
```

### 格式化

| 文件类型                                               | 工具              | 命令                                |
| ------------------------------------------------------ | ----------------- | ----------------------------------- |
| Markdown (root/.opencode/skills/.github) / JSON / YAML | prettier          | `pnpm run format`                   |
| Python                                                 | ruff              | `cd studio && uv run ruff format .` |
| TypeScript / TSX                                       | eslint (web 内置) | `cd web && pnpm lint`               |

### 提交流程

husky pre-commit 自动执行 lint-staged：

- `.md` → prettier + markdownlint
- `.json/.jsonc/.yaml/.yml` → prettier
- `.ts/.tsx/.js/.jsx/.mjs/.cjs/.css` → prettier
- `.py` → ruff check + format（依赖 `studio/.venv`，由 `./scripts/install.sh` 创建）

husky commit-msg 自动执行 commitlint 校验提交信息格式。

## Pull Request 流程

1. 从 `main` 创建功能分支 (`feat/<name>`) 或修复分支 (`fix/<name>`)
2. 提交代码并推送至远程
3. 创建 Pull Request，标题遵循 Conventional Commits 格式
4. 通过 CI 检查（lint + 构建）后合并

## 测试

后端测试**前置条件**：本机 MySQL 已启动，且 `studio/.env.dev` 已按上文配置（conftest 每个用例前会 TRUNCATE `sd_*` 表，无库则全部报连接错误）；可用 `studio/sql/schema.sql` 初始化表结构。

```bash
# 后端测试（需 MySQL，见上方前置条件）
cd studio && APP_ENV=dev uv run pytest -v

# 全量检查 (markdownlint + prettier check + ruff check + eslint)
pnpm run check
```
