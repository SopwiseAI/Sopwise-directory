# 安全政策

## 上报漏洞

请**不要**公开提交 Issue 报告安全漏洞。请使用 GitHub 的私密上报通道：

<https://github.com/sopwise-ai/xigee/security/advisories/new>

（仓库 **Security → Report a vulnerability**，该通道已启用。）

- 报告中请包含：受影响组件与路径、版本或提交、复现步骤或 PoC、影响范围、建议修复方式
- 备选联系方式：**待补充**（仓库当前未公开邮箱；启用专用邮箱或 PGP 公钥后在此处补充）
- 请勿在报告中附带真实生产数据、真实凭据或个人数据，演示请使用本地环境

Security reports in English are welcome. Please use the private channel above instead of a
public issue; we acknowledge within **7 business days** and follow a **90-day** coordinated
disclosure window.

## 项目构成（安全范围的基础）

本仓库不是单一静态站点，而是三套组件，**三者都在范围内**：

| 组件           | 技术栈             | 说明                                                             |
| -------------- | ------------------ | ---------------------------------------------------------------- |
| Web 前端       | Next.js 16（SSG）  | `web/`，部署在 Vercel → <https://www.xigee.net>                  |
| Studio 后端    | FastAPI + MySQL    | `studio/`，数据管理 API（按 `APP_ENV` 加载 `studio/.env.<env>`） |
| Skills/Scripts | Python CLI / Shell | `skills/`、`scripts/`，含数据流水线与 `scripts/mcp-mysql.sh`     |

根目录 `opencode.json` 定义了三个本地 MySQL MCP 连接（dev 允许写，sit/prod 只读），同样在范围内。

## 支持的版本

| 版本                                     | 支持状态          |
| ---------------------------------------- | ----------------- |
| `main` 分支最新提交                      | ✅ 接受报告并修复 |
| 当前线上部署（web 与 studio 生产环境）   | ✅ 接受报告并修复 |
| 历史提交 / 已归档分支 / 已停止运营的环境 | ❌ 不提供安全补丁 |

自托管部署只保证 `main` 最新代码的安全修复，不为第三方修改或旧版本部署提供支持。

## 范围内（示例，非穷尽）

- 前端：XSS、CSP 或安全响应头绕过、开放重定向、敏感信息进入客户端产物
- Studio API：认证与授权缺陷、越权访问（IDOR）、SQL 注入、导出接口的 API Key 校验绕过、CORS 配置错误、SSRF
- 凭据与数据库：凭据泄露、`.env*` 或导出产物泄露、生产库非授权访问、只读边界绕过
- 供应链与 CI/CD：依赖投毒、lockfile 篡改、GitHub Actions 权限或注入、发布流程完整性
- AI 工具链：`opencode.json` / MCP 配置滥用与本地命令执行、`skills/` CLI 命令注入

## 不在范围内

- 需要物理接触设备，或终端、浏览器已被完全接管的场景
- 仅影响已停止支持的历史版本、分支或环境的问题
- 缺少可复现 PoC 的扫描器批量报告、纯配置缺失（除非能证明可利用）
- 社会工程、垃圾信息、拒绝服务类压测
- 第三方依赖自身的漏洞：请报给上游；我们仍会跟踪升级

## 响应与披露

| 阶段       | 目标时间                                         |
| ---------- | ------------------------------------------------ |
| 确认收到   | 7 个工作日内（尽力而为，本项目由小团队维护）     |
| 初步评估   | 14 个工作日内                                    |
| 修复或缓解 | 严重 30 天内、高 60 天内，中低按计划             |
| 公开披露   | 修复发布后，或与报告者协商的日期（默认 90 天内） |

- 我们按协调披露（coordinated disclosure）处理，报告者可选择匿名
- 经您同意，我们会在 GitHub Security Advisory（GHSA）中致谢；GitHub 是 CNA，可从 advisory 申请 CVE
- 本项目**没有**付费漏洞赏金计划
- 安全港（safe harbor）：对于遵守本政策、不访问他人数据、不破坏服务的研究者，我们不会采取或支持法律行动

非安全类缺陷请直接走普通 Issue，见 [SUPPORT.md](./SUPPORT.md)。
