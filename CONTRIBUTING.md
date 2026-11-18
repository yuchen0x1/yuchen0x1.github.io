# 参与开发

从 `main` 新建短期分支，提交 PR 前运行 `npm ci`、`npm run verify`、`npm run build` 和 `npm run test:dist`。改动加载流程时同时检查桌面、窄屏和安装后的 PWA。版本、快照和回滚流程见 [维护手册](docs/maintenance.md)。

公开快照由采集工作流维护。提交源码变更时请避免把本地缓存和临时数据纳入 Git。仓库目前没有项目级开源许可证，向外复用项目代码前请联系作者确认授权。
