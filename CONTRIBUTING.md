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
npm install

# 安装各模块依赖
./scripts/sync.sh

# 启动开发服务
./scripts/dev.sh          # 前端 + 后端
./scripts/dev-web.sh      # 仅前端 (port 3000)
./scripts/dev-studio.sh   # 仅后端 (port 8000)
```

## 代码规范

### 提交规范 (Conventional Commits)

```
<type>(<scope>): <subject>

feat: 新功能
fix: 修复 bug
docs: 文档
style: 格式调整
refactor: 重构
test: 测试
chore: 构建/工具
```

### 格式化

| 文件类型               | 工具              | 命令                                |
| ---------------------- | ----------------- | ----------------------------------- |
| Markdown / JSON / YAML | prettier          | `npm run format`                    |
| Python                 | ruff              | `cd studio && uv run ruff format .` |
| TypeScript / TSX       | eslint (web 内置) | `cd web && pnpm lint`               |

### 提交流程

husky pre-commit 自动执行 lint-staged：

- `.md` → prettier + markdownlint
- `.json/.yaml` → prettier
- `.py` → ruff check + format

husky commit-msg 自动执行 commitlint 校验提交信息格式。

## 测试

```bash
# 后端测试
cd studio && APP_ENV=dev uv run pytest -v
```

## 产品状态流程

```
0=草稿 → 1=待审核 → 2=已发布 → 3=已下架
```

使用 `/std-*` 系列命令管理产品数据。
