# 本地验证记录

## v1.1.1 验收（2026-11-27）

环境：Windows、Node.js 22.23.5、Vite 8.3.8、Edge 158（BrowserSkill 0.5.0）。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 安装与验证 | PASS | `npm ci` 成功，`npm run verify` 包含类型检查、ESLint、13 项前端和 18 项 Node 测试 |
| 构建与产物 | PASS | `npm run build`、`npm run test:dist` 完成，版本为 1.1.1 |
| 全量依赖审计 | PASS | 官方 npm registry 返回 0 漏洞 |
| 旧版更新提醒 | PASS | 使用 v1.1.0 标签的真实生产页面，替换服务器构建后出现“当前版本 v1.1.0 · 新版作品集已就绪” |
| 确认升级与缓存 | PASS | 点击更新后页脚显示 v1.1.1，worker 接管成功，Cache Storage 只保留新版应用缓存 |
| 桌面与移动布局 | PASS | 桌面与 390×844 iPhone 14 仿真视口无页面横向溢出，Canvas 有非空像素 |
| 移动端交互 | PASS | 导航打开和关闭、中英文和深浅主题切换、搜索 aa-browser 及空结果提示均正常 |

Service Worker 的资源完整性失败由回归测试模拟；本次未独立验证 Safari、Firefox、真实移动设备和物理离线网络。

## 历史验收（2026-11-18）

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

## GitHub Pages 验收（2026-11-18）

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| GitHub 仓库 | PASS | `yuchen0x1/yuchen0x1.github.io` 的 `main` 分支已推送 |
| Actions 构建 | PASS | workflow run `44151015028` 的 build job 成功 |
| Pages 发布 | PASS | 同一 run 的 deploy job 成功，Pages 状态为 `built` |
| 首页 | PASS | `https://yuchen0x1.github.io/` 返回 HTTP 200 |
| 根路径资源 | PASS | `assets/*.js`、`assets/*.css`、`favicon.svg` 均返回 HTTP 200，内容类型正确 |
