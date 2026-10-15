# 贡献指南

感谢参与！提交前请先阅读 [行为准则](./CODE_OF_CONDUCT.md)；安全漏洞请走 [安全政策](./SECURITY.md)；使用类问题见 [获取帮助](./SUPPORT.md)。

## 项目结构

```
web/                 前端 (Next.js 16 SSG + pnpm)
studio/              后端 (FastAPI + uv + MySQL)
skills/              AI 套件 (Python CLI + prompts)
scripts/             开发脚本 (Shell)
.opencode/           opencode 命令与 Agent 规则
opencode.json        opencode 配置（含本地 MySQL MCP 连接，见「AI 工具配置」）
pnpm-workspace.yaml  pnpm 行为设置（非敏感项）
.github/             CI 与 Issue / PR 模板
```

## 前置要求

| 依赖    | 版本             | 依据                                                                                             |
| ------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| Node.js | 24（Active LTS） | `.nvmrc`、`package.json` 的 engines（`>=24.0.0`）                                                |
| pnpm    | >= 12            | `package.json` 的 engines、`packageManager`（当前 12.11.2）                                      |
| Python  | >= 3.13          | `studio/pyproject.toml`                                                                          |
| uv      | >= 0.11.30       | `studio/pyproject.toml` 的 `[tool.uv] required-version`（低于它 uv 会直接拒绝执行；CI 固定同值） |
| MySQL   | >= 5.7           | `studio/sql/schema.sql`、后端测试必需                                                            |
| git     | >= 2.32          | husky 钩子与 lint-staged 17（后者硬性要求 git >= 2.32）                                          |

首次克隆后 `pnpm install` 会自动安装 husky 钩子。Node 或 git 版本过低时，提交钩子会在
`lint-staged` 一步失败（此时 `nvm install 24` / 升级 git 即可）；CI 使用 `node-version-file: .nvmrc`，
请以 `.nvmrc` 的版本为准。

## 开发环境

```bash
# 安装根工程化依赖（同时安装 husky 钩子）
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

## AI 工具配置

`opencode.json` 与 `.opencode/` 是本仓库自带的 AI 工具（opencode）配置，包含：

- `opencode.json`：Agent 指令文件（`instructions`）与三个本地 MySQL MCP 连接（`mysql-dev` 允许写；
  `mysql-sit` / `mysql-prod` 只读，凭据来自被忽略的 `studio/.env.<env>`，配置里不含任何密钥）
- `.opencode/commands/`：`std-*` 系列项目命令
- MCP server 由根 `package.json` 的 `devDependencies` **锁定精确版本**，通过本地 bin 执行，
  不会在运行时从网络拉取最新版本

个人覆盖配置不要改受版本控制的 `opencode.json`，两种方式二选一：写全局配置
`~/.config/opencode/opencode.json`；或在仓库内放本地文件并用环境变量指定
`OPENCODE_CONFIG=./opencode.local.json`（该文件名已在 `.gitignore` 中）。

## 代码规范

### 分支命名

```
feat/<name>      新功能
fix/<name>       缺陷修复
refactor/<name>  重构
chore/<name>     工程化/工具链变更
docs/<name>      文档
data/<name>      数据同步（唯一允许提交 web/data/topics.json 与 tools.json 的功能分支）
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

纯格式化提交（例如全仓 prettier 重排）请单独提交，并把该提交的完整 SHA 追加到
`.git-blame-ignore-revs`，避免 `git blame` 的每一行都指向格式化提交。GitHub 的 blame 视图会自动
识别该文件；本地可用 `git config blame.ignoreRevsFile .git-blame-ignore-revs` 启用。

**scope 白名单**（commitlint 的 `scope-enum` 为强制校验，未列出的 scope 会被拒绝）：

| scope               | 适用范围                                               |
| ------------------- | ------------------------------------------------------ |
| `web`               | `web/` 前端                                            |
| `studio`            | `studio/` 后端                                         |
| `skills`            | `skills/` AI 套件                                      |
| `scripts`           | `scripts/` 脚本                                        |
| `root`              | 根目录文件与仓库工程化（含 `.github/`）                |
| `docs`              | 文档                                                   |
| `data`              | `web/data/topics.json` / `tools.json` 数据同步分支专用 |
| `deps` / `deps-dev` | 依赖升级（Dependabot 自动生成的 scope）                |
| `ci`                | CI / 工作流相关改动                                    |

scope 可以省略（例如 `chore: 更新 CI`），省略时不做校验。

### 格式化

| 范围                                                        | 工具               | 命令                                   |
| ----------------------------------------------------------- | ------------------ | -------------------------------------- |
| 全仓库 Markdown / JSON / JSONC / YAML / TS / TSX / JS / CSS | prettier           | `pnpm run format` / `format:check`     |
| Markdown 规则（`**/*.md`）                                  | markdownlint-cli2  | `pnpm run lint:md` / `lint:md:fix`     |
| Python 静态检查                                             | ruff               | `pnpm run lint:py` / `format:py:check` |
| Python 类型                                                 | mypy（strict）     | `pnpm run typecheck:py`                |
| TypeScript / TSX 语义                                       | eslint（web 内置） | `pnpm run lint:web`                    |
| Shell                                                       | 暂无               | 遵循 `.editorconfig`（4 空格缩进）     |

行宽只有一套标准：`.prettierrc` 的 `printWidth`（Markdown 为 200）；`.editorconfig` 不再声明行宽。

Python 的类型门禁配置在 `studio/pyproject.toml` 的 `[tool.mypy]`：`app/` 是 `strict = true`，`tests/` 走放宽的一层（只查会真的出错的类型问题，不强制每个用例写签名）。CI 与本地走的是同一份配置，不存在两套标准。

### 提交流程

husky pre-commit 自动执行 lint-staged：

- `.md` → prettier + markdownlint
- `.json/.jsonc/.yaml/.yml` → prettier
- `.ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs/.css` → prettier
- `.py` → ruff check + format（依赖 `studio/.venv`，由 `./scripts/install.sh` 创建）

husky commit-msg 自动执行 commitlint 校验提交信息格式（type 与 scope 规则见上文）。
分支名规范与 `web/data/topics.json` / `web/data/tools.json` 的提交限制由 husky pre-commit 钩子把关，不通过则拒绝提交。

## Pull Request 流程

1. 从 `main` 创建分支：`feat/<name>`、`fix/<name>`、`refactor/<name>`、`chore/<name>`、
   `docs/<name>`，数据同步用 `data/<name>`
2. 提交代码（提交信息遵循上文 type 与 scope 规则）并推送至远程
3. 创建 Pull Request，标题遵循 Conventional Commits 格式
4. 通过 CI 检查（根检查 markdownlint + prettier、web 的 lint / typecheck / test / build、studio 的 ruff + mypy + pytest）后合并

`web/data/topics.json` 与 `web/data/tools.json` 是生产数据源：只有 `main` 与 `data/<name>` 分支允许提交，其余分支会被
`.husky/pre-commit` 拒绝。

## 测试

后端测试**前置条件**：本机 MySQL 已启动，且 `studio/.env.dev` 已按上文配置（conftest 每个用例前会 TRUNCATE `xg_*` 表，无库则全部报连接错误）；可用 `studio/sql/schema.sql` 初始化表结构。默认 dev 库不是专用测试库，所以还要显式放行破坏性清理（`make test ALLOW_SHARED_DB=1`，等价于 `STUDIO_ALLOW_SHARED_DB_TRUNCATE=1`）；不设这个开关时 pytest 以退出码 3 直接退出，不会碰库。

```bash
# 后端测试（需 MySQL，见上方前置条件）
pnpm run lint:py                 # ruff check
pnpm run format:py:check         # ruff format 校验
pnpm run typecheck:py            # mypy (app/ strict, tests/ 放宽)
cd studio && make test ALLOW_SHARED_DB=1

# 前端测试与类型检查（需先 ./scripts/install.sh）
pnpm run test:web                # vitest
pnpm run typecheck:web           # tsc --noEmit
pnpm --dir web build             # next build

# 全量本地检查（markdownlint + prettier + ruff + eslint + tsc + vitest）
# CI 另含 web 的 next build（本地按需 `pnpm --dir web build`）
pnpm run check
```
