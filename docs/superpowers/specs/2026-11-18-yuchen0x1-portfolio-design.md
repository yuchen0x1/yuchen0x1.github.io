# yuchen0x1 科技个人主页设计规格

日期：2026-11-18（Asia/Shanghai）。状态：架构与视觉方向已确认；本文等待最终审阅。

## 1. 目标与授权边界

从空工作区创建可运行、可维护的个人主页，集中展示 yuchen0x1 的真实开源项目、公开 GitHub 数据与开发动态。首屏的 Agent 网络形成辨识度，项目交互演示说明工具价值，仓库榜单承担数据探索。

本次交付包括完整源码、锁定依赖、配置、README、静态部署配置、GitHub Actions 数据采集与部署示例，以及 Cloudflare Workers / Vercel 代理示例。本地构建和交互验证属于实施范围。发布到公网、创建远程仓库、配置远程 Secret、恢复旧站点均在后续明确授权时执行。

工作目录为 `E:\移动云盘同步盘\宣传`。当前没有现存项目或 Git 历史。旧项目归档位于工作区之外，不读取、不恢复、不复制其代码或凭证。

## 2. 已确认的决策与项目内容

- 以 GitHub Actions 每 30 分钟生成的公开快照作为主数据源。
- 保留 `aa-browser`；替换提示词中未在公开列表找到的两个项目，采用已核实存在的 `PROJECT-NEXUS` 与 `mind-bench`。
- 采用暗色项目工作台布局、Hero Agent 网络、多色状态体系、可扫描的仓库榜单。
- 使用轻量 Canvas 节点网络，不引入重型 Three.js 场景；这是原提示词允许的降级路径。
- 默认中文与深色主题，提供完整英文界面和浅色主题。

项目内容分为个人配置文案、GitHub 实际数据、明确标注的交互演示。演示中的日志、仓库修复流程和评测结果均标注“交互演示 · 示例数据”，不得暗示真实执行了任务或检测了账号。

| 旗舰项目 | 页面重点 | 演示内容 | 特别标注 |
| --- | --- | --- | --- |
| aa-browser | Electron / Chromium 浏览器，MCP 接入、结构化快照、自动化操作 | Agent 光标选择元素、输入内容，ref 标记与 MCP 日志同步；Agent → MCP Server → Electron → Chromium 架构图 | 根据公开仓库内容描述；本页演示不控制真实浏览器 |
| PROJECT-NEXUS | Windows AI 仓库工作台，连接 GitHub、监控仓库与辅助开发交付 | 选择模拟 Issue，展示分析、隔离修复、差异预览、等待审核流程 | 明确显示“开发预览”；演示不调用 AI、不提交 PR |
| mind-bench | 本地 AI 模型评测，多模型比较、规则评分与报告 | 可选择示例模型和题组，展示雷达、折线、评分与运行阶段 | 明确显示示例评测，不编造真实模型排名 |

每项均有项目名称、价值说明、痛点、3–4 项功能、技术栈、实时快照徽章、仓库链接。仅在真实存在非预发布的最新 Release 时显示版本与下载入口；没有 Release 时不生成下载链接。项目详情抽屉渲染采集到的 README Markdown，缺失时使用配置摘要。

个人简介采用占位文案；邮箱、X 等未知字段保持空值。`config/site.ts` 用 `TODO: 替换为真实内容` 注释集中标出需用户补充的内容。未配置联系方式不生成虚假地址或无效按钮。

## 3. 视觉系统

### 色彩

| 令牌 | 默认深色值 | 用途 |
| --- | --- | --- |
| background | `#070B12` | 页面底色 |
| surface | `#111A23` | 内容面、对话框与导航 |
| border | `#2B3945` | 分隔和边界 |
| blue | `#5AA9FF` | 主交互、链接、焦点 |
| cyan | `#42D7C7` | 在线、成功与数据流 |
| purple | `#B192F5` | AI 类别与评测 |
| amber | `#F0B85A` | 缓存、预览与提示 |

保留请求中的电光蓝 `#3B82F6`、紫 `#7C3AED`、青 `#22D3EE` 作为非文字光效的派生值。文字采用较亮的可读版本。浅色主题使用冷白背景、深色正文，重设边界与语义色，不能简单反相。

CSS 变量同时定义字号、间距、4/8/14/22px 层级圆角、阴影和 120/220/500ms 动效时长。玻璃与渐变描边主要用于 Hero 状态面板与演示框，表格和普通内容减少阴影。

### 字体与排版

Space Grotesk 用于英文大标题，Inter / Noto Sans SC 用于正文，IBM Plex Mono 用于终端与数据。优先以合法分发的 WOFF2 子集自托管；中文采用所需字符子集，不能下载完整大字库阻塞首屏。保留系统字体回退和 `font-display: swap`，首屏最多预加载一种必要字体。

桌面正文左对齐，段落行宽不超过约 70 个拉丁字符。桌面内容最大宽度约 1320px，主体留白随视口缩放。四个断点为 480、768、1024、1280px；320px 起可用，无整页横向溢出。

### 布局

```text
固定导航：Logo / Home / About / Projects / Live Rank / Activity / Contact
          主题 / 语言 / 音效 / GitHub；Ctrl 或 Cmd + K 打开命令面板

Hero：左侧署名、循环角色、slogan、CTA；右侧 Agent 网络与 Live Status
       底部真实统计条与滚动提示
About：简介占位、whoami 终端；技术栈分组墙
Projects：三个可切换项目，内容介绍 + 大型交互演示；手机依次展示
Live Rank：全宽筛选工具栏；桌面榜单与图表联动，手机堆叠
Activity：近期活动热力图、事件流、最近提交、Skills 雷达
Timeline：独立开发历程；创建与 Release 节点、正倒序
Contact：已配置的联系入口、态度标语、版权、数据来源、回到顶部
```

首屏 Agent 网络是最强视觉元素；其余区块遵循内容层级。HUD 角标、噪点和扫描线限制在 Hero / 终端区域，不能干扰正文、图表或键盘焦点。

## 4. 前端架构与目录职责

使用 Vite + React + TypeScript、Tailwind CSS、Motion for React、Lucide React、Recharts。选择实施时官方稳定且互相兼容的版本，通过锁文件固定。Canvas 使用浏览器原生二维绘制。Markdown 使用 React Markdown + GFM，禁用原始 HTML执行。

```text
src/
  components/         通用导航、按钮、抽屉、Toast、命令面板、终端
  components/sections/ 各页面章节
  components/demos/    三个纯前端演示，按需加载
  components/charts/   Recharts 封装与无障碍数据摘要，按需加载
  config/site.ts       用户、双语文案、项目、技术栈、联系方式、数据模式
  hooks/               数据订阅、可见性、视口、偏好与快捷键
  services/            快照读取、缓存校验、GitHub 可选客户端
  types/               快照、仓库、事件、采集状态与历史类型
  styles/              令牌、主题、全局布局与效果
  App.tsx              章节组合与全局状态边界
scripts/               Node.js 采集器与快照验证
public/data/           repos.json、history.json；不含 Token 和私人数据
public/                SVG favicon、社交分享图、必要字体
examples/              Cloudflare Workers / Vercel 只读代理示例
.github/workflows/     采集和 GitHub Pages 部署示例
docs/                  设计、实施计划、动画与验证记录
```

不在页面组件里硬编码个人资料或项目描述。纯 UI 状态、数据读取状态与演示状态分别维护。全局仅共享主题、语言、音效、命令面板、终端、Toast 和数据快照。

## 5. 快照、历史和 API 数据流

### 数据流与时效

```text
Actions 计划任务 / 手动触发
  → GitHub REST：用户 / 分页仓库 / 语言 / 详情 / Release / 最近提交 / README / 公开事件
  → 数据校验、与旧快照合并、记录 Star 历史
  → public/data/repos.json + history.json
  → 同一工作流显式触发构建与 Pages 部署
  → 页面首次加载 + 每 60 秒同源条件请求
  → 内存快照 + localStorage 最后成功缓存
```

Actions 计划每小时第 17、47 分钟执行，UTC cron 为 `17,47 * * * *`。GitHub 的计划任务可能延迟，不承诺严格每 30 分钟到达。页面分别显示“数据采集于”和“上次检查于”，手动刷新只检查已发布快照，不能伪装成触发 GitHub 采集。

标签页隐藏时取消自动刷新计时、暂停动画；恢复可见后仅在到期时刷新。相同请求合并，卸载时取消请求。使用请求超时和加载终态，不能因网络挂起挡住页面。

同源 JSON 使用 `ETag` / `If-None-Match`（可用时）或浏览器 HTTP 缓存重新验证；304 继续使用已有正文。匿名 GitHub API 的 304 不保证免配额。可选代理与采集器使用服务端认证、持久化 ETag 和对应响应正文。

### 快照契约

`repos.json` 至少包含以下字段；所有时间为 ISO 8601 UTC，展示时依据当前语言格式化。

- `schemaVersion: 1`、`username`、`generatedAt`、`lastSuccessfulAt`。
- `profile`：GitHub 用户名、昵称、头像、主页、公开仓库数、followers；不采集非公开资料。
- `repos[]`：稳定 id、name、fullName、description、URL、language、topics、fork、archived、createdAt、updatedAt、pushedAt、stars、forks、issues、subscribers。
- `languagesByRepo`：仓库 id 到语言字节数字典，另带采集时间与是否过期。
- `releasesByRepo`：最新正式版本、发布时间、发布页面和可用下载链接；缺失为 null。
- `commitsByRepo`：默认分支最近一条提交的 sha、message、date、URL；空仓库为空值。
- `readmesByRepo`：三项旗舰仓库的原始 Markdown、默认分支和采集时间。
- `events[]`：规范化的公开事件，保留类型、仓库、事件 id、时间和可验证链接。
- `coverage`：分页是否完整、各明细端点成功/失败/沿用旧值列表、事件覆盖起止时间。
- `rateLimit`：采集时的 remaining、limit、resetAt、observedAt、来源；不能标成访客当前配额。

`history.json` 保存从首次成功采集起的总 Star / Fork 和各仓库 Star 快照，最多保留 366 天。相同 30 分钟时间桶幂等更新，不补造历史值。仅一个点时展示起始快照与说明；累计至少两个点后绘制增长线。

### 采集边界与失效处理

- 用户与仓库清单为核心数据；失败时保留最后成功快照，不将错误响应写成空清单覆盖已有数据。
- 仓库分页遵循 Link header，每页最多 100；安全上限 10 页，达到上限明确记录未完整采集。数量统计不可声称是完整账户总数。
- 公开 events 最多读取 3 页，遵守响应轮询建议；不把近期事件当成一年完整贡献记录。
- 语言、仓库详情中的 subscribers、Release、最近提交顺序请求，避免突发并发。通过 ETag 与缓存复用未变化的响应；README 只取三个旗舰项目。
- 请求按 Retry-After / rate-limit-reset 退避；其他临时失败指数退避、最多重试 2 次。单端点超时 10 秒，任务总体超时 12 分钟，已获取核心清单可以发布标为部分明细的快照。
- Release 404、空仓库提交 409、README 404 属于正常缺失；其他 403 / 429、5xx 与网络错误记录为失败或沿用旧值，不能当作数据为零。
- GitHub `watchers_count` 与 Star 重复，Watch 需使用 `subscribers_count`；没有该数据时显示破折号并提供说明。
- 语言比例按已成功获取的语言字节数汇总，标明覆盖范围；不能按仓库数量冒充代码字节比例。
- API 剩余额度使用实际响应头，未知时不显示编造额度。采集器的额度只展示快照采集时状态。
- localStorage 不可用、内容损坏、schema 不匹配时安全忽略缓存；实时读取和页面其他模块继续可用。
- 无当前快照但有缓存时显示缓存与年龄；完全无数据时显示可重试错误态，保留项目静态介绍与导航。
- 空排行榜、无搜索结果、无公开事件分别展示明确空态；不注入虚假仓库、随机活动或伪热力图。

## 6. 页面功能与交互

### 导航与 Hero

吸顶导航在滚动后增加背景与模糊，通过 IntersectionObserver 高亮当前章节。顶部滚动进度条只读展示。手机导航为全屏抽屉，打开后锁定背景滚动，Esc 关闭，焦点返回菜单按钮。

开屏状态与字体就绪、静态配置、首次数据请求结束关联。没有完成的阶段不得显示 OK；数据失败显示缓存 / 离线状态。最迟 3 秒退出开屏，数据在后台继续加载。支持跳过、同会话跳过和 reduced-motion 直接进入。

Hero 包含署名解码、角色打字循环、原提示词 slogan、查看项目 / GitHub / 已配置邮箱 CTA。Live Status 展示头像、followers、公开仓库数、总 Star、最近 push 与数据年龄；绿色表示有效的新鲜快照，缓存或过期改为琥珀并显示说明。

自定义鼠标保留系统指针与键盘语义，仅在细指针桌面、未减少动态效果时显示点与跟随环。磁吸与 tilt 只用于少量 CTA / 演示卡，限制幅度并在离开时复原。

### About 与项目

About 展示配置占位简介、whoami 终端和四组技术栈。统计数字仅在首次进入视口时递增，目标为真实快照统计；加载前为骨架，不能先显示虚构数字。

桌面项目区采用可访问 Tab 与单个大预览，三个演示按需加载；手机使用纵向可展开项目。Tab 支持方向键、Home/End，项目详情抽屉管理焦点、Esc 与返回焦点。Markdown 原始 HTML 禁用，链接和图片 URL 限制为安全协议；相对路径以对应仓库默认分支解析，图片懒加载。

### Live Rank

默认按 Star 降序显示仓库。支持 Star、Fork、最近更新、创建日期、名称排序及升降序；语言、Topic、关键词、隐藏 Fork、隐藏归档可组合，提供清除筛选。默认隐藏 Fork 与已归档；总览统计注明全账户/当前筛选的不同口径。

行展示前三名奖牌、名称、描述、语言、Star、Fork、Watch、Issues、更新时间、Topics、相对第一名的 Star 条。全部 Star 为零时条宽为零，不能除以零。排行稳定以仓库 id 为布局键，排序使用 Motion layout 的 FLIP；reduced-motion 直接重排。

新快照与上次有效快照比较后显示真实 Star 差值、排名升降与短暂高亮；首次加载、筛选切换及排序切换不产生伪增长提示。新增仓库标注新增，删除仓库移出列表。相同 Star 的稳定次序按名称与 id。

Recharts 按需展示 Top N Star 横条、按字节汇总的语言环图、Star / Fork 气泡图及实际快照增长折线；每图有文字摘要或数据表替代。榜单移动端摘要行可展开细节，筛选控件有可读标签。

### Activity 与 Timeline

Activity 使用公开事件绘制“近期活动图”，注明实际覆盖日期，不生成虚假一年贡献数据。事件类型包括 Push、Star、Fork、Issue、PR、Release，只有实际返回事件才显示；新事件按 id 去重并滑入。

最近提交终端读取采集的 commitsByRepo，显示仓库、真实消息与前 7 位 sha，提供暂停自动滚动。Skills 雷达为语言比例与 config 手动权重的可视化，必须标成“展示权重”，不当成客观能力测评。

Timeline 使用仓库 created_at 与真实最新 Release 发布时间生成节点；明确只展示已采集的最新版本里程碑，支持正倒序。节点进入视口点亮，减少动态效果时保持静态。时间线可独立定位，但导航主项保持原提示词结构。

### 联系方式与全局交互

提供已配置的 GitHub / Gitee / Email / X 等入口；邮箱复制使用 Clipboard API，失败时给出可选择文本与反馈。Footer 使用当前年份、配置态度文案、Powered by GitHub API 与回到顶部按钮。

命令面板支持 Ctrl / Cmd + K、章节跳转、仓库搜索、主题与语言切换、打开 GitHub，具备搜索无结果态、键盘选择与焦点管理。

反引号打开隐藏终端，支持 help / whoami / projects / rank / theme dark|light / clear；输入框中不拦截普通键，IME 合成时不触发快捷键。rank 使用当前真实快照。

Konami 彩蛋使用轻量 Canvas 矩阵雨，持续最多 8 秒，Esc 可退出；触屏不要求输入该序列，reduced-motion 不播放。音效默认关闭，通过用户点击后 Web Audio 合成，不加载音频素材，关闭后立即停止。

主题切换采用 View Transition 圆形扩散，浏览器不支持或 reduced-motion 时直接切换；持久化偏好。页面隐藏后标题变为 come back 提示，回到页面恢复配置标题。

## 7. 无障碍、性能与 SEO

- 语义化 landmark、顺序标题、跳转主内容链接、可见 focus-visible；文本与 UI 颜色按 WCAG AA 检查。
- 抽屉、命令面板、终端具有明确名称、aria-modal、焦点约束和返回焦点；键盘可关闭。
- 所有动画遵守 prefers-reduced-motion，动画不携带唯一信息；装饰 Canvas aria-hidden。
- Canvas 限制 DPR ≤ 1.5，桌面节点数量上限 70；触屏显示静态或极少量节点，隐藏页面及离开 Hero 时取消 RAF。
- 滚动监听使用被动事件与 RAF 合并，章节观测使用 IntersectionObserver；不在每帧更新 React 全树。
- 图表、Markdown、项目演示、终端和彩蛋动态导入；首屏压缩 JS 目标 ≤ 180KiB，初始不下载图表与演示块。
- 图片设置尺寸、懒加载；减少 backdrop-filter 面积，本地字体优先使用必要子集。
- Lighthouse 性能目标 ≥ 90，记录实际环境和分数；未达到时说明瓶颈，不把目标写成已通过。
- 静态 HTML title、description、canonical、OG / Twitter metadata、SVG favicon、站点社交分享图、robots.txt；JSON-LD 使用 Person 与 WebSite，未知信息不填造。
- 静态主 HTML 提供可索引的标题、简介与主要项目链接，以及 JavaScript 不可用时的访问说明。
- 不把 Token、Actions 密钥或个人账号数据写进 src、Vite public env、JSON 快照或日志。

## 8. Actions、代理与部署交付

Actions 采集工作流支持 schedule 与 workflow_dispatch，最小 contents 写权限用于仅提交 data 文件，使用 concurrency 防止重叠提交。服务端读取 GITHUB_TOKEN，配额不足时可选择只读公开资料的专用 Secret，但前端不得读取该 Token。

数据改变后仅提交公开快照文件，构建与 Pages 部署通过显式工作流步骤或 reusable workflow 完成，避免依赖 GITHUB_TOKEN push 自动触发另一工作流。Pages 部署任务独立声明 pages/id-token 权限。示例不执行任何远程操作，启用步骤写在 README。

README 分别说明 GitHub Pages 的 base path、Vercel 静态构建与 Cloudflare Pages 静态构建。定时数据要对用户可见，必须部署包含新 JSON 的产物；Vercel / Cloudflare 需配置对应重新构建机制，或使用后端代理源，不能只提交 JSON 后就声称线上已更新。

Cloudflare Workers 与 Vercel 代理示例仅允许读取固定 yuchen0x1 的用户、所属公开仓库、语言、Release、最近提交和 README 等白名单 GET 路径。禁止任意 URL 转发，限制分页与路径长度，固定上游主机，凭证仅加给 api.github.com，缓存响应并透传必要的 ETag / 限额头。Origin 来自部署配置；不暴露开放任意代理。

README 覆盖安装、开发、构建、预览、配置修改、数据时效、故障回退、快照历史原理、代理 Secret、工作流启用、部署更新、动画与性能取舍，以及替换简介/联系资料的方法。

## 9. 实施与验证验收

实施按四个可独立核验的阶段推进，范围不缩减：基础壳与设计令牌；数据契约和采集管线；所有页面与演示；全局交互、可访问性、优化与文档。

| 验收领域 | 必须有的证据 |
| --- | --- |
| 工程 | npm 安装锁定依赖成功；TypeScript、lint、生产 build 成功；本地预览 HTTP 可访问 |
| 数据 | 固定公开 fixture 验证排序筛选、0 Star、分页、304 正文复用、403/429 回退、错误缓存、部分明细合并、Star/排名差值、历史幂等 |
| 真实服务 | 至少一次真实公开 GitHub 采集，记录时间与覆盖范围；外部限流时明确阻塞，不伪造成功快照 |
| 页面 | BrowserSkill 验证桌面与手机导航、筛选、项目切换/演示、详情、复制/缺失联系信息、主题、语言、命令面板和终端 |
| 状态 | 覆盖加载、空结果、网络失败/缓存、页面隐藏暂停、3 秒开屏兜底、同会话跳过 |
| 可访问性 | 键盘焦点顺序、Esc 与返回焦点、颜色对比、reduced-motion、手机触控和无整页横向溢出 |
| 视觉 | 保存桌面与手机截图，自检字号、留白、密度、可读性、图表和裁切 |
| 性能 | 记录产物体积和 Lighthouse 实测；≥90 为目标，报告运行参数与尚未解决问题 |
| 文档/部署 | README 与配置、脚本、工作流实际一致；本地准备、远程启用与公网验证分别报告 |

浏览器验证遵循用户要求，默认使用 Tencent BrowserSkill。仅当其不可用时记录原因并采用替代方式；没有实际执行的浏览器组合不能声称通过。Chrome / Edge / Safari / Firefox 采用标准 API 和能力检测兼容，分别列出实测范围。

## 10. 官方依据与设计自检

- GitHub REST 最佳实践：`https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api`；认证条件请求、顺序请求、限流退避。
- GitHub API 配额：`https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api`；匿名、PAT、Actions 内置 Token 的限额口径不同，界面不固定假设 5000。
- Actions schedule：`https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule`；计划任务可能延迟，选择避开整点的时间。
- GitHub 仓库 API：`https://docs.github.com/en/rest/repos/repos`；仓库分页、语言字节与仓库详情字段。

自检结论：已明确实时性、演示标签、未知个人资料、Watch 指标、近期热力图范围、历史起点、快照部署和降级路径。本文无待定的实现边界；个人简介与联系方式的 TODO 是用户要求的可编辑内容，不是缺失功能。实施前需用户确认本文；确认后生成逐项实施计划并继续本地开发。
