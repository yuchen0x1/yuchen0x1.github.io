# Portfolio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline in this session. Track each task with its evidence below.

**Goal:** Deliver the approved complete bilingual personal website and public-data pipeline.

**Architecture:** React static application consuming versioned same-origin snapshots. A sequential Node collector produces public GitHub data and append-only time-bucketed Star history. Lazy demos, charts and Markdown keep the initial application small.

**Tech Stack:** Vite, React, TypeScript, Tailwind, Motion, Recharts, Lucide, React Markdown, Vitest, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-18-yuchen0x1-portfolio-design.md` (approved 2026-11-18).

## Global Constraints

- 默认中文与深色主题，提供完整英文界面和浅色主题。
- 不把 Token、Actions 密钥或个人账号数据写进 src、Vite public env、JSON 快照或日志。
- 使用轻量 Canvas 节点网络，不引入重型 Three.js 场景。
- 所有动画遵守 prefers-reduced-motion，动画不携带唯一信息。
- Browser interaction uses Tencent BrowserSkill first.
- Implement in the existing explicitly assigned empty project workspace, on a feature branch. Do not restore archives or publish remotely.

## Task 1: Data contracts, foundation and tests

Files: `package.json`, Vite/TypeScript/ESLint configs, `src/types/github.ts`, `src/services/model.ts`, `tests/model.test.ts`.

Interfaces: `selectRepos(repos, filters): Repo[]`, `summarize(repos)`, `changes(previous, next)`, `validateSnapshot(value): value is Snapshot`.

- [ ] Create pinned dependency manifest and tool configurations; install dependencies.
- [ ] First write hand-checked tests: combined language/topic/search filters; archived/fork exclusion; stable Star ties; ascending name; zero Star denominator; changed stars and rank movement; malformed cached snapshot rejection. Example assertion: `expect(selectRepos([alpha,beta], {sort:'stars',direction:'desc',query:'',language:'all',topic:'all',hideForks:true,hideArchived:true}).map(r=>r.name)).toEqual(['beta','alpha'])` where beta has 5 Stars and alpha has 2.
- [ ] Observe missing exports fail; implement model contracts; rerun tests and typecheck.

## Task 2: Real collection, persistence and polling

Files: `scripts/github-client.mjs`, `scripts/collect.mjs`, `scripts/history.mjs`, `tests/collector.test.mjs`, `src/services/snapshot.ts`, `src/hooks/useSnapshot.ts`.

Interfaces: `createClient({fetchImpl,cache,token,sleep})` returns `get(path)`; `recordHistory(history,snapshot)` returns versioned samples; `loadSnapshot(signal)` validates JSON; `useSnapshot()` returns snapshot/history/loading/error/cached/checkedAt/refresh/previous.

- [ ] Write network-boundary tests before client code: 304 reuses saved body; malformed 304 fails; 403 is not zero data; 429 honors bounded retry; invalid paths cannot receive credentials; history bucket updates are idempotent. Assert literal returned payload and persistent sample counts.
- [ ] Implement sequential paginated collection, metadata headers, bounded retries, optional detail merge and atomically replaced public JSON. Save private ETag bodies only under ignored `.cache/`.
- [ ] Collect real public data; preserve existing output if core endpoints fail. Record coverage and partial failures.
- [ ] Implement validated localStorage fallback, AbortController timeout, non-overlapping minute polling, hidden-page pause, recovery and conditional GET. Add storage-corruption and fallback tests.

## Task 3: Full responsive site

Files: `src/config/site.ts`, `src/styles/*`, `src/components/sections/*`, `src/components/Network.tsx`, `src/components/charts/Charts.tsx`, `src/App.tsx`, `src/main.tsx`, `index.html`, `public/*`.

Consumes: Snapshot/Repo data contracts and useSnapshot result. Produces: semantic section ids home/about/projects/rank/activity/timeline/contact.

- [ ] Implement the approved named color tokens, local fonts, responsive navigation, Hero and live status, About and grouped stack.
- [ ] Implement repository filter controls, stable FLIP rows, actual rank deltas and all four chart views; add textual chart summaries.
- [ ] Implement actual event heatmap with coverage, event stream, commit log with pause, weighted Skills radar, repository/Release timeline and contact.
- [ ] Add SEO, favicon, social preview, robots and safe structured data. Build and check deferred chunks.

## Task 4: Interactive demonstrations and global controls

Files: `src/components/demos/*`, `src/components/Modal.tsx`, `src/components/Overlays.tsx`, `src/components/Readme.tsx`, `src/hooks/usePreferences.ts`, `tests/ui.test.tsx`.

Consumes: configured project narratives and real snapshots. Produces: accessible project Tabs/details, demo actions, palette/terminal/intro.

- [ ] Write UI behavior tests before controls: focus returns after Escape, no shortcut interception in inputs, language/theme persistence, repository search and demo progress are user-visible. Use real components, not component mocks.
- [ ] Implement browser/MCP, NEXUS and benchmark demos with permanent bilingual example labels; respect reduced motion and pause when hidden.
- [ ] Add intro tied to actual loading and 3-second deadline/session skip, circular theme transition, language, command palette, terminal commands, opt-in Web Audio, Konami rain, cursor/tilt, progress, tab title and copy feedback.
- [ ] Render sanitized Markdown in a focus-managed dialog, resolve relative links and lazy images safely.

## Task 5: Automation, review and delivery

Files: `.github/workflows/*`, `examples/proxy/*`, `README.md`, `docs/verification.md`.

Interfaces: collector executable `node scripts/collect.mjs`; build `npm run build`; static output `dist/`; optional fixed-user GET proxy routes.

- [ ] Add collection cron `17,47 * * * *`, private cache persistence, concurrency, data-only commit and explicit Pages build/deploy. Document Vercel/Cloudflare rebuild requirement and base paths.
- [ ] Implement bounded fixed-upstream proxy with ETag/cache/allowlist/CORS and test disallowed endpoints and methods.
- [ ] Run `npm test`, `npm run test:collector`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] Start preview, verify HTTP; use BrowserSkill for desktop/mobile, core actions, keyboard/reduced motion/error states; save screenshots.
- [ ] Measure compressed initial JS and Lighthouse where available. Record actual results, environment and external limitations.
- [ ] Review final diff, update task evidence, commit only intended project changes; leave running local preview for user.

## Review

Coverage: spec sections 1–3 → tasks 1/3; 4–5 → tasks 1/2/5; 6 → tasks 3/4; 7 → tasks 3/4/5; 8 → task 5; 9 → all verification steps. Execution continues under the user's explicit approval; no additional design gate is pending.
