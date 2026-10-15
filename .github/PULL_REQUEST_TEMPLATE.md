## 变更说明

<!-- 这个 PR 做了什么、为什么做（一两句话） -->

## 关联 Issue

<!-- 如：Closes #123；没有可留空 -->

## 验证方式

<!-- 本地跑过哪些检查，例如：pnpm run check / cd web && pnpm test -->

## 检查清单

- [ ] 提交信息遵循 Conventional Commits（`type(scope): subject`）
- [ ] `pnpm run check` 本地通过
- [ ] `web/data/topics.json` 与 `web/data/tools.json` 只在 `data/<name>`（或 `main`）分支提交，其余分支会被 pre-commit 拒绝
- [ ] 涉及 UI 变更时已附截图/录屏
- [ ] 破坏性变更已在上方「变更说明」中标注
