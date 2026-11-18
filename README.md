# yuchen0x1 · 独立开发者实验室

一个面向 `yuchen0x1` 的双语个人作品集。页面以公开 GitHub 快照为数据源，展示个人简介、技术栈、旗舰项目、仓库排行、动态、提交日志和创建时间线。

[访问作品集](https://lenmo.top/) · [GitHub Pages](https://yuchen0x1.github.io/) · [最近部署](https://github.com/yuchen0x1/yuchen0x1.github.io/actions/workflows/pages.yml) · [数据刷新记录](https://github.com/yuchen0x1/yuchen0x1.github.io/actions/workflows/collect.yml)

## 本地运行

```powershell
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173/`。生产构建使用：

```powershell
npm run typecheck
npm test
npm run test:collector
npm run lint
npm run build
```

## 数据快照

`public/data/repos.json` 和 `public/data/history.json` 是可提交的公开数据快照。手动刷新：

```powershell
node scripts/collect.mjs
```

采集器只访问固定的 GitHub 公开接口，支持 `GITHUB_TOKEN` / `GH_TOKEN` 提升速率额度。Token 只从环境变量读取，私有 ETag 缓存在被忽略的 `.cache/` 中，不会写入页面、快照或日志。

`.github/workflows/collect.yml` 每小时在第 17 分和第 47 分运行一次，只提交两个快照文件；`.github/workflows/pages.yml` 构建 `dist/` 并部署 GitHub Pages。当前用户站点从域名根路径构建，应用的数据和 favicon 会跟随根路径。

## 可选代理

`examples/proxy/server.mjs` 是一个固定用户的只读 GitHub 代理示例：只允许 `yuchen0x1` 的用户、仓库语言、Release、提交和 README 路由，拒绝任意搜索或写入接口，并提供 ETag、短缓存和 CORS。

```powershell
$env:CORS_ORIGIN = 'https://lenmo.top'
node examples/proxy/server.mjs
```

默认监听 `127.0.0.1:8787`。代理只适合部署在你自己的边缘函数或服务器上；不要把 GitHub Token 写入仓库。

## 项目结构

- `src/`：React 页面、数据模型、快照加载和 Canvas 网络背景
- `scripts/`：GitHub 采集、缓存和 Star 历史记录
- `public/data/`：公开快照
- `examples/proxy/`：固定上游代理示例
- `.github/workflows/`：快照刷新和 Pages 构建工作流
