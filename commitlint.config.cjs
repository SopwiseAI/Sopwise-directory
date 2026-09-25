module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
    "scope-enum": [2, "always", ["web", "studio", "skills", "scripts", "root", "docs"]]
  }
}
