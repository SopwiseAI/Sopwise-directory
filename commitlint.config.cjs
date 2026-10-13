module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]
    ],
    // 中文 subject 没有大小写概念，关闭该规则否则中文提交会被误判
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
    // scope 允许省略（历史提交大量使用 chore: / fix: 形式），省略时不校验
    "scope-empty": [0],
    // 白名单必须与仓库自身流程自洽，否则就是在拦自己的自动化产物：
    // - deps / deps-dev：Dependabot（dependabot.yml 的 prefix=chore + include=scope）生成
    // - data：web/data/data.json 数据同步分支（见 .husky/pre-commit、CONTRIBUTING）
    // - ci：CI / 工作流相关改动
    "scope-enum": [
      2,
      "always",
      ["web", "studio", "skills", "scripts", "root", "docs", "data", "deps", "deps-dev", "ci"]
    ]
  }
}
