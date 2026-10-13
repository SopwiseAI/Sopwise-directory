# 获取帮助

## 我该去哪里提问

| 需求                     | 渠道                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| 使用问题、部署、数据导入 | [GitHub Issues](https://github.com/sopwise-ai/xigee/issues)（请先搜索已有 Issue，并选用「功能建议」模板） |
| 可复现的缺陷             | [缺陷报告模板](https://github.com/sopwise-ai/xigee/issues/new?template=bug_report.yml)                    |
| 安全漏洞                 | 不要开公开 Issue，请走 [安全政策](./SECURITY.md) 的私密上报通道                                           |
| 参与开发                 | 见 [贡献指南](./CONTRIBUTING.md) 与 [行为准则](./CODE_OF_CONDUCT.md)                                      |

## 我们接受与不接受什么

- 接受：本仓库代码（`web/`、`studio/`、`skills/`、`scripts/`）的缺陷与改进建议，以及数据条目的更正请求
- 不接受：第三方依赖自身的缺陷（请报给上游，但欢迎顺手提一个升级 PR）、纯环境问题
  （本机 MySQL / Node 未按贡献指南配置）、索取私有数据或生产环境访问权

## 响应预期

本项目由小团队维护，Issue 通常在 **7 个工作日内**首次回复，不承诺修复时间。提交问题时请附上：

- 使用的提交哈希或版本
- `pnpm run check` 或 `pnpm run test:web` 的相关输出
- 涉及界面时附截图或录屏

## Support in English

Questions and pull requests are welcome in English or Chinese. Open a GitHub Issue with the
appropriate template; security reports must use the private channel described in
[SECURITY.md](./SECURITY.md).
