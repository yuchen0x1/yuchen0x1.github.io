# 开发、发布与维护

## 架构和功能基线

React 与 TypeScript 负责展示，Vite 输出静态资源。公开快照位于 `public/data/`，采集脚本访问固定 GitHub API。浏览器的 localStorage 保存语言、主题和最后可用的快照。可选 Node 代理使用固定上游和路由白名单。数据结构为 schemaVersion 1，升级时继续读取现有格式。

已有功能包括中英文页面、主题切换、三个旗舰项目、示例演示、仓库搜索及组合筛选、Star 排行、README 抽屉、活动和提交、时间线、邮箱复制、命令面板、终端和移动导航。新模块增加安装、离线与更新，不涉及数据库迁移。

## 本地验证

使用 Node.js 22.12 以上版本。运行 `npm ci`、`npm run verify`、`npm run build`、`npm run test:dist`。使用 `npm run preview` 验证生产模式的 Service Worker，开发服务器不注册 worker。CI 在 Ubuntu、Windows 和 macOS Runner 执行同样的构建检查。

执行 `npm audit --registry=https://registry.npmjs.org` 查看全依赖结果，执行 `npm audit --omit=dev --registry=https://registry.npmjs.org` 查看运行依赖结果。镜像 registry 的 audit 端点可能不可用。

## 分支与权限

`main` 存放正式源码，短期分支通过 PR 合并。功能分支可以使用 `codex/` 前缀。合并要求三个操作系统的 Verify 检查。单维护者仓库使用 PR 并允许零个外部批准。主分支的删除与强制推送应由 ruleset 禁止。

`portfolio-snapshots` 保存自动采集结果。采集工作流只向这条分支提交两个公开 JSON 文件，Pages 从 main 读取源码，并从该分支读取最新数据。采集完成后通过 workflow_run 触发 Pages。main 中的快照为可独立构建的版本基线。

工作流默认为只读。采集 job 拥有内容写权限，Pages 的 deploy job 拥有页面与 OIDC 权限，Release 的 publish job 拥有内容、OIDC 与证明写权限。第三方 Action 固定到完整提交 SHA，Dependabot 负责提出升级 PR。

## 版本和正式发布

语义化版本写入 package.json 和 lockfile。新增用户功能升 minor，兼容性修复升 patch。更新 README 最新区和 docs/releases/release-notes.md 后，经 PR 和 CI 合并，再在对应 main 提交创建 `vX.Y.Z` 标签。

Release Web 检查标签与包版本、main 归属、测试、运行依赖漏洞和生产构建。归档包含页面、图标、公开快照、Service Worker、版本信息及第三方许可证文本。发布资产包括 Web ZIP、SHA256SUMS.txt 和 release-metadata.json。发布 job 会为这三类资产生成 GitHub artifact attestation。

维护者下载资产后执行以下校验，仓库与签名工作流需明确匹配。

```powershell
gh release download v1.1.1 --repo yuchen0x1/yuchen0x1.github.io --pattern '*web.zip'
gh attestation verify .\yuchen0x1-lab-v1.1.1-web.zip --repo yuchen0x1/yuchen0x1.github.io --signer-workflow yuchen0x1/yuchen0x1.github.io/.github/workflows/release.yml
```

SHA-256 检查下载内容完整性，签名证明用于确认 GitHub 发布工作流来源。Web 的页面信任根为 HTTPS 主机，客户端不会执行独立下载的安装程序。

## 静态部署与容器

解压 Web 归档到静态服务器根目录。HTML、sw.js、version.json、manifest 和 data 需要重新校验缓存，带内容哈希的 assets 可长期缓存。部署应先创建完整的新目录，再原子切换 current 链接。保存前一个目录，以便校验失败后切回。生产发布前确认新目录在预期发布根目录下。

本地构建后运行 `docker build -t yuchen0x1-lab:1.1.1 .`，再运行 `docker run --rm -p 8080:8080 yuchen0x1-lab:1.1.1`。容器以 nginx 用户运行。NAS 可采用同一容器，将 HTTPS 交给现有反向代理。更新时部署新归档或重建镜像。

## PWA 和页面更新

首次成功安装 Service Worker 时，对页面、JS、CSS、清单和图标进行完整性校验并预缓存。离线页面从该缓存读取，最后可用的公开快照从 localStorage 恢复。照片和未缓存字体可能依赖网络，正文可使用系统字体显示。

已打开的页面每两分钟检查 worker，并在回到前台或恢复网络时检查。新版预缓存成功后显示更新提示。用户选择稍后时，在当前页面会话中隐藏同一更新。确认后激活新 worker，等其接管后刷新。初次访问时的安装按钮遵循浏览器提示事件，Safari 可使用浏览器菜单添加主屏幕。

预缓存校验失败或下载中断时，旧 worker 继续提供页面。主机回滚后，浏览器可将回滚构建安装为新的 worker，仍经用户确认。localStorage 由浏览器管理，隐私模式和系统空间回收会影响离线持久性。

## 长期检查

Dependabot 每周提出 npm 与 Action 升级。Project maintenance 每周执行完整依赖审计，并检查两个站点的元数据、快照时效及最新 Release 资产。Research watch 每月生成研究对象的活动快照作为 Actions artifact，功能取舍由维护者审阅。

每周维护任务会阻断存在高危或严重问题的生产依赖，并将完整锁文件审计报告保存为 30 天的 Actions artifact。完整报告用于跟踪构建和测试工具的安全告警，处理前应核对具体公告、受影响版本和依赖路径。发布工作流单独执行生产依赖审计，避免把开发工具的报告误当成已进入静态站点运行环境。
