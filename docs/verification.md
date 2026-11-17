# 本地验证记录

环境：Windows、Node.js 22、Vite 8、Chromium（Tencent BrowserSkill）、2026-11-18。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| `npm run typecheck` | PASS | TypeScript 编译无错误 |
| `npm test` | PASS | Vitest 7/7 |
| `npm run test:collector` | PASS | Node 测试含采集器和代理测试 |
| `npm run lint` | PASS | ESLint 无错误、无警告 |
| `npm run build` | PASS | Vite 生产构建完成，输出 `dist/` |
| 本地首页 | PASS | `http://127.0.0.1:5173/` 加载快照并显示 29 个公开仓库 |
| 项目 Tab | PASS | Aa Browser、PROJECT NEXUS、MIND BENCH 可切换 |
| Live Rank | PASS | 搜索 `aa-browser` 后只保留匹配仓库 |
| README 抽屉 | PASS | 仓库行打开 Markdown 详情，关闭按钮恢复页面 |
| 主题 / 语言 | PASS | 深色/浅色和中文/英文切换可见并持久化 |
| 命令面板 / 终端 | PASS | Ctrl/⌘+K、反引号、`help` 命令可用 |
| 移动端 | PASS | iPhone 14 视口下导航菜单打开，排行布局可滚动查看 |

浏览器验收使用了桌面视口和 iPhone 14 仿真视口；远程部署验收见下节。

## 远程部署验收（2026-11-18）

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 服务器发布 | PASS | 发布版本 `lengmo-lab-20261118-023513`，Nginx reload 成功 |
| 首页内容一致性 | PASS | 本地与线上 `index.html` SHA-256 均为 `249635e985d2dc381870a1fadb5e4af3a516c9ab3f516f13faee4d47226bedca` |
| HTTPS 首页 | PASS | `https://lenmo.top/` 返回 HTTP 200 |
| HTTP 跳转 | PASS | `http://lenmo.top/` 返回 301 并跳转到 HTTPS |
| www 域名 | PASS | `https://www.lenmo.top/` 返回 HTTP 200 |
| 静态入口 | PASS | `favicon.svg`、`robots.txt`、`sitemap.xml` 均返回 HTTP 200 |

本次部署为直接服务器发布；Git 远程仓库未配置，因此未执行 Git push 或 GitHub Pages 发布。
