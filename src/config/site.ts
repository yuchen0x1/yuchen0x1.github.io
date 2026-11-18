export const site = {
  username: 'yuchen0x1',
  name: '冷漠不是神',
  title: 'yuchen0x1 / 独立开发者实验室',
  description: '把模糊的需求拆成清晰的系统，把重复的工作变成可靠的工具。',
  descriptionEn: 'I turn ambiguous requirements into clear systems and repetitive work into reliable tools.',
  slogan: 'Building the hands and eyes for AI Agents.',
  github: 'https://github.com/yuchen0x1',
  gitee: 'https://gitee.com/yuchen0x1',
  website: 'https://lenmo.top',
  email: 'lenmo181@qq.com',
  roles: ['AI Infra Builder', 'Browser Automation', 'Codex Ecosystem Developer'],
  stacks: {
    'AI / Agent': ['MCP', 'OpenAI', 'Electron', 'Prompt engineering'],
    Desktop: ['React', 'Tauri', 'Flutter', 'WPF'],
    Backend: ['Go', 'Python', 'Java', 'PHP'],
    Tools: ['TypeScript', 'Vite', 'Docker', 'PostgreSQL'],
  },
  projects: [
    {id:'aa-browser',name:'Aa Browser',repo:'aa-browser',color:'#42d7c7',tag:'Agent browser',slogan:'给 AI 一双手和一双眼。',pain:'无头浏览器难以人机共用，Agent 也很难稳定理解页面。',features:['完整 Chromium 浏览体验','MCP 协议接入','结构化快照与 ref 编号','网络抓包与增量更新'],tech:['Electron','Chromium','MCP','TypeScript'],
      en:{slogan:'Give AI hands and eyes.',pain:'People and agents struggle to share a headless browser, and agents need a consistent way to interpret pages.',features:['Full Chromium browser','MCP integration','Structured snapshots with element references','Network capture and incremental updates']}},
    {id:'project-nexus',name:'PROJECT NEXUS',repo:'PROJECT-NEXUS',color:'#5aa9ff',tag:'AI repository ops',slogan:'把仓库运营变成一条可观察的路径。',pain:'仓库修复、审阅和版本交付分散在多个工具里。',features:['仓库健康监控','隔离修复工作区','差异与授权策略','PR 与 Release 工作流'],tech:['Electron','GitHub API','AI','JavaScript'],
      en:{slogan:'Track repository maintenance from diagnosis to release.',pain:'Fixing, reviewing, and releasing changes often takes several separate tools.',features:['Repository health monitoring','Isolated repair workspaces','Diff review and approval policies','Pull request and release workflows']}},
    {id:'mind-bench',name:'MIND BENCH',repo:'mind-bench',color:'#b192f5',tag:'Local model evaluation',slogan:'让模型比较有证据，也有过程。',pain:'本地模型评测常常缺少可复现的题库、规则和报告。',features:['203 道题库','多模型对比','规则评分与 AI 裁判','可复现评测报告'],tech:['React','SQLite','LLM','JavaScript'],
      en:{slogan:'Compare models with evidence and a repeatable process.',pain:'Local model evaluations often lack reproducible questions, scoring rules, and reports.',features:['203-question bank','Side-by-side model comparisons','Rule-based scoring and AI judging','Reproducible evaluation reports']}},
  ],
};
export type SiteProject = typeof site.projects[number];
