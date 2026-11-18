import {useEffect, useMemo, useState} from 'react';
import type {CSSProperties, FormEvent} from 'react';
import {ArrowDown, ArrowUp, Check, ChevronDown, Command, Copy, ExternalLink, GitBranch as Github, Menu, Moon, RefreshCw, Search, Sun, X} from 'lucide-react';
import ReactMarkdown, {defaultUrlTransform} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {site} from './config/site';
import {useSnapshot} from './hooks/useSnapshot';
import {defaultFilters, type Filters, type Language, type Repo} from './types/github';
import {selectRepos, starRatio, summarize} from './services/model';
import {Network} from './components/Network';
import './styles.css';
import {WebAppStatus} from './components/WebAppStatus';

const copy = {zh:{home:'首页',about:'关于',projects:'项目',rank:'Live Rank',activity:'动态',timeline:'时间线',contact:'联系',view:'查看项目',github:'打开 GitHub',live:'实时状态',cached:'缓存数据',fresh:'数据在线',refresh:'刷新',all:'全部',search:'搜索仓库、描述或主题',demo:'交互演示 · 示例数据',details:'查看 README 摘要',close:'关闭',language:'语言',topic:'主题'},en:{home:'Home',about:'About',projects:'Projects',rank:'Live Rank',activity:'Activity',timeline:'Timeline',contact:'Contact',view:'View projects',github:'Open GitHub',live:'Live status',cached:'Cached data',fresh:'Data online',refresh:'Refresh',all:'All',search:'Search repositories, descriptions or topics',demo:'Interactive demo · sample data',details:'Read README summary',close:'Close',language:'Language',topic:'Topic'}};
const fmtNumber=(value:number)=>new Intl.NumberFormat('zh-CN').format(value);
const relative=(value:string)=>{const delta=Date.now()-Date.parse(value);if(!Number.isFinite(delta))return '—';const minutes=Math.max(1,Math.floor(delta/60000));if(minutes<60)return `${minutes} min ago`;const hours=Math.floor(minutes/60);if(hours<24)return `${hours} h ago`;return `${Math.floor(hours/24)} d ago`};
const eventIcon=(type:string)=>type.includes('Push')?'↗':type.includes('Star')?'★':type.includes('Fork')?'⑂':type.includes('Release')?'◆':'•';
const commandActions = [
  {id:'#home', zh:'返回首页', en:'Go home'},
  {id:'#rank', zh:'打开仓库排行', en:'Open live rank'},
  {id:'theme', zh:'切换主题', en:'Toggle theme'},
  {id:'lang', zh:'切换语言', en:'Switch language'},
  {id:'github', zh:'打开 GitHub', en:'Open GitHub'},
];
const shellHelp = 'help  whoami  projects  rank  theme dark|light  clear';

function readmeUrl(url:string, attribute:string, repo:Repo, branch=repo.defaultBranch) {
  try {
    const root = `${repo.url}/blob/${encodeURIComponent(branch)}/`;
    if (url.startsWith('#')) return defaultUrlTransform(new URL(url, repo.url).href);
    const resolved = new URL(url, root);
    if (url.startsWith('/') && !url.startsWith('//')) {
      resolved.pathname = new URL(root).pathname + resolved.pathname.slice(1);
    }
    if (attribute==='src' && resolved.href.startsWith(root)) resolved.searchParams.set('raw','true');
    return defaultUrlTransform(resolved.href);
  } catch {
    return '';
  }
}

function readPreference<T extends string>(key:string, initial:T, alternative:T):T {
  try { return localStorage.getItem(key)===alternative ? alternative : initial; }
  catch { return initial; }
}

function savePreference(key:string, value:string) {
  try { localStorage.setItem(key,value); } catch { /* storage is optional */ }
}

function App(){
  const {snapshot,history,loading,cached,error,refresh}=useSnapshot();
  const [lang,setLang]=useState<Language>(()=>readPreference('lang','zh','en'));
  const [theme,setTheme]=useState<'dark'|'light'>(()=>readPreference('theme','dark','light'));
  const [menuOpen,setMenuOpen]=useState(false);
  const [commandOpen,setCommandOpen]=useState(false);
  const [commandQuery,setCommandQuery]=useState('');
  const [terminalOpen,setTerminalOpen]=useState(false);
  const [terminalInput,setTerminalInput]=useState('');
  const [terminalOutput,setTerminalOutput]=useState('LENMO shell · type help');
  const [copied,setCopied]=useState(false); const [activeProject,setActiveProject]=useState(site.projects[0].id); const [detailsRepo,setDetailsRepo]=useState<Repo|null>(null); const [filters,setFilters]=useState<Filters>(defaultFilters); const [timelineReverse,setTimelineReverse]=useState(false);
  const t=copy[lang];
  useEffect(()=>{document.documentElement.dataset.theme=theme;savePreference('theme',theme)},[theme]);
  useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en';savePreference('lang',lang)},[lang]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if (event.isComposing) return;
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k') {
        event.preventDefault();
        setCommandQuery('');
        setTerminalOpen(false);
        setDetailsRepo(null);
        setCommandOpen(true);
      }
      if (event.key==='`'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&
          !(event.target instanceof HTMLElement && (event.target.isContentEditable||event.target.matches('input, textarea, select')))) {
        event.preventDefault();
        setCommandOpen(false);
        setDetailsRepo(null);
        setTerminalOpen((value)=>!value);
      }
      if (event.key==='Escape') {
        setCommandOpen(false);
        setTerminalOpen(false);
        setDetailsRepo(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);
  const repos=useMemo(()=>snapshot?.repos||[],[snapshot]); const stats=summarize(repos); const languages=useMemo(()=>Array.from(new Set(repos.map((repo)=>repo.language).filter(Boolean) as string[])).sort(),[repos]); const topics=useMemo(()=>Array.from(new Set(repos.flatMap((repo)=>repo.topics))).sort(),[repos]); const visibleRepos=useMemo(()=>selectRepos(repos,filters),[repos,filters]); const featured=site.projects.find((project)=>project.id===activeProject)||site.projects[0]; const featuredRepo=repos.find((repo)=>repo.name===featured.repo); const maxStars=Math.max(0,...visibleRepos.map((repo)=>repo.stars));
  const copyEmail=async()=>{if(!site.email)return;try{await navigator.clipboard.writeText(site.email);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{setCopied(false)}};
  const featuredText=lang==='en'?featured.en:featured;
  const topRepos=useMemo(()=>selectRepos(visibleRepos,{...defaultFilters,hideForks:false,hideArchived:false}).slice(0,6),[visibleRepos]);
  const lastPush=repos.reduce((latest,repo)=>repo.pushedAt>latest ? repo.pushedAt : latest,'');
  const recentSamples=history?.samples.slice(-30)??[];
  const maxHistoricalStars=Math.max(1,...recentSamples.map((sample)=>sample.stars));
  const timeline=useMemo(()=>{
    const entries=repos.flatMap((repo)=>{
      const release=snapshot?.releasesByRepo[repo.name];
      const created={id:`created-${repo.id}`,date:repo.createdAt,name:repo.name,description:repo.description,url:repo.url};
      return release?.date ? [created,{id:`release-${repo.id}`,date:release.date,name:`${repo.name} ${release.tag}`,description:lang==='zh'?'版本发布':'Release published',url:release.url}] : [created];
    });
    return entries.sort((a,b)=>timelineReverse ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)).slice(0,12);
  },[repos,snapshot,timelineReverse,lang]);
  const readme=detailsRepo ? snapshot?.readmesByRepo[detailsRepo.name] : null;
  const query=commandQuery.trim().toLowerCase();
  const filteredActions=commandActions.filter((action)=>[action.zh,action.en,action.id].some((label)=>label.toLowerCase().includes(query)));
  const command=(action:string)=>{
    setCommandOpen(false);
    if(action.startsWith('#')) window.location.hash=action;
    if(action==='theme')setTheme((value)=>value==='dark'?'light':'dark');
    if(action==='lang')setLang((value)=>value==='zh'?'en':'zh');
    if(action==='github')window.open(site.github,'_blank','noopener,noreferrer');
  };
  const terminalSubmit=(event:FormEvent)=>{
    event.preventDefault();
    const value=terminalInput.trim().toLowerCase();
    if (!value) return;
    setTerminalInput('');
    switch (value) {
      case 'theme dark':
      case 'theme light': {
        const nextTheme=value==='theme dark'?'dark':'light';
        setTheme(nextTheme);
        setTerminalOutput(`Theme: ${nextTheme}`);
        break;
      }
      case 'clear': setTerminalOutput(''); break;
      case 'rank': setTerminalOutput(topRepos.slice(0,5).map((repo,index)=>`${index+1}. ${repo.name} ★ ${repo.stars}`).join('\n')||'No repositories.'); break;
      case 'whoami': setTerminalOutput('yuchen0x1 / independent builder'); break;
      case 'projects': setTerminalOutput(site.projects.map((project)=>project.name).join('\n')); break;
      case 'help': setTerminalOutput(shellHelp); break;
      default: setTerminalOutput('Unknown command. Type help for available commands.');
    }
  };
  return <div className="app-shell">
    <div className="scroll-progress" />
    <header className="topbar"><a className="brand" href="#home" onClick={()=>setMenuOpen(false)}><span className="brand-mark">Y</span><span>yuchen0x1</span></a><button className="mobile-menu" aria-label={lang==='zh'?'切换导航':'Toggle navigation'} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={()=>setMenuOpen((value)=>!value)}>{menuOpen?<X size={20}/>:<Menu size={20}/>} </button><nav id="site-navigation" className={menuOpen?'nav-links open':'nav-links'}>{[['home',t.home],['about',t.about],['projects',t.projects],['rank',t.rank],['activity',t.activity],['timeline',t.timeline],['contact',t.contact]].map(([id,label])=><a key={id} href={`#${id}`} onClick={()=>setMenuOpen(false)}>{label}</a>)}<button className="icon-button" title="Toggle theme" aria-label="Toggle theme" onClick={()=>setTheme((value)=>value==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon-button" title="Switch language" aria-label="Switch language" onClick={()=>setLang((value)=>value==='zh'?'en':'zh')}>{lang==='zh'?'EN':'中'}</button><a className="nav-github" href={site.github} target="_blank" rel="noreferrer"><Github size={15}/>{t.github}</a></nav></header>
    {cached&&<div className="status-strip amber">{t.cached} · {snapshot?.generatedAt?new Date(snapshot.generatedAt).toLocaleString():''}</div>}
    {error&&!snapshot&&<div className="status-strip amber">Snapshot unavailable · static project information remains available · <button onClick={()=>void refresh()} disabled={loading}>{t.refresh}</button></div>}
    <main id="main">
      <section id="home" className="hero section"><Network/><div className="hero-content"><p className="eyebrow"><span className="signal"/> independent builder / 河南</p><h1>{site.username}</h1><p className="hero-role"><span className="role-cursor">▌</span>{site.roles[0]}</p><p className="hero-slogan">{site.slogan}</p><div className="hero-actions"><a className="button primary" href="#projects">{t.view}<ChevronDown size={16}/></a><a className="button ghost" href={site.github} target="_blank" rel="noreferrer"><Github size={16}/>{t.github}</a><button className="button text" onClick={copyEmail}><Copy size={15}/>{copied?'Copied':'Copy email'}</button></div></div><aside className="live-panel"><div className="panel-kicker"><span className={cached?'signal amber':'signal'}/>{cached?t.cached:t.live}<button className="refresh-button" onClick={()=>void refresh()} disabled={loading} aria-label={t.refresh}><RefreshCw size={15} className={loading?'spin':''}/></button></div>{snapshot?<><div className="profile-row"><img src={snapshot.profile.avatar} alt=""/><div><strong>{snapshot.profile.name}</strong><span>@{snapshot.profile.login}</span></div></div><div className="live-grid"><Metric label="Followers" value={fmtNumber(snapshot.profile.followers)}/><Metric label="Repositories" value={fmtNumber(snapshot.profile.publicRepos)}/><Metric label="Stars" value={fmtNumber(stats.stars)}/><Metric label="Last push" value={relative(lastPush)}/></div><p className="panel-foot">snapshot {new Date(snapshot.generatedAt).toLocaleString()} · {snapshot.coverage.complete?'complete':'partial'}</p></>:<div className="skeleton-block" role="status">{loading?(lang==='zh'?'正在加载 GitHub 快照…':'Loading GitHub snapshot…'):(lang==='zh'?'GitHub 快照暂不可用':'GitHub snapshot unavailable')}</div>}</aside><div className="hero-scroll">scroll to inspect the system <span>↓</span></div></section>
      <section className="stat-band"><div className="container stat-grid"><Metric label="Public repositories" value={fmtNumber(stats.count)}/><Metric label="Total stars" value={fmtNumber(stats.stars)}/><Metric label="Total forks" value={fmtNumber(stats.forks)}/><Metric label="Active in 30 days" value={fmtNumber(stats.active)}/></div></section>
      <section id="about" className="section container"><SectionHead index="01" title={t.about} intro={lang==='en'?site.descriptionEn:site.description}/><div className="about-grid"><div className="terminal-card"><div className="terminal-head"><span/><span/><span/><code>whoami</code></div><div className="terminal-body"><p><b>name</b> {site.name}</p><p><b>handle</b> {site.username}</p><p><b>focus</b> AI systems / automation</p><p><b>principle</b> build quietly. ship clearly.</p><p className="terminal-caret">_</p></div></div><div className="stack-board">{Object.entries(site.stacks).map(([group,items])=><div className="stack-group" key={group}><h3>{group}</h3><div>{items.map((item)=><span key={item}>{item}</span>)}</div></div>)}</div></div></section>
      <section id="projects" className="section projects-section"><div className="container"><SectionHead index="02" title={t.projects} intro="Three public repositories. Three ways to give software more agency."/><div className="project-tabs" role="tablist">{site.projects.map((project)=><button key={project.id} className={activeProject===project.id?'project-tab active':'project-tab'} onClick={()=>setActiveProject(project.id)} role="tab" aria-selected={activeProject===project.id}><span style={{background:project.color}}/>{project.name}</button>)}</div><div className="project-feature"><div className="project-copy"><p className="eyebrow" style={{color:featured.color}}>{featured.tag}</p><h3>{featured.name}</h3><p className="project-slogan">{featuredText.slogan}</p><p>{featuredText.pain}</p><div className="feature-list">{featuredText.features.map((feature)=><span key={feature}><Check size={14}/>{feature}</span>)}</div><div className="tag-row">{featured.tech.map((tech)=><span key={tech}>{tech}</span>)}</div><div className="project-actions"><a className="button primary" href={`https://github.com/${site.username}/${featured.repo}`} target="_blank" rel="noreferrer"><Github size={15}/>Repository</a>{featuredRepo&&<button className="button ghost" onClick={()=>setDetailsRepo(featuredRepo)}>{t.details}<ExternalLink size={15}/></button>}</div></div><DemoPanel projectId={featured.id} color={featured.color}/></div></div></section>
      <section id="rank" className="section container"><SectionHead index="03" title={t.rank} intro="A public repository index refreshed from the latest published snapshot."/><div className="rank-toolbar"><label className="search-field"><Search size={16}/><input value={filters.query} onChange={(event)=>setFilters({...filters,query:event.target.value})} placeholder={t.search}/></label><select aria-label={lang==='zh'?'排序方式':'Sort by'} value={filters.sort} onChange={(event)=>setFilters({...filters,sort:event.target.value as Filters['sort']})}><option value="stars">Stars</option><option value="forks">Forks</option><option value="updatedAt">Updated</option><option value="createdAt">Created</option><option value="name">Name</option></select><button className="icon-button" title="Toggle sort direction" aria-label="Toggle sort direction" onClick={()=>setFilters({...filters,direction:filters.direction==='desc'?'asc':'desc'})}>{filters.direction==='desc'?<ArrowDown size={16}/>:<ArrowUp size={16}/>}</button><select value={filters.language} aria-label={t.language} onChange={(event)=>setFilters({...filters,language:event.target.value})}><option value="all">{t.all} · {t.language}</option>{languages.map((language)=><option key={language}>{language}</option>)}</select><select value={filters.topic} aria-label={t.topic} onChange={(event)=>setFilters({...filters,topic:event.target.value})}><option value="all">{t.all} · {t.topic}</option>{topics.map((topic)=><option key={topic}>{topic}</option>)}</select><label className="check-label"><input type="checkbox" checked={filters.hideForks} onChange={(event)=>setFilters({...filters,hideForks:event.target.checked})}/> hide forks</label><label className="check-label"><input type="checkbox" checked={filters.hideArchived} onChange={(event)=>setFilters({...filters,hideArchived:event.target.checked})}/> hide archived</label></div><div className="rank-layout"><div className="repo-table"><div className="repo-table-head"><span># / repository</span><span>language</span><span>stars</span><span>forks</span><span>updated</span></div>{visibleRepos.length===0?<div className="empty-state">No repositories match these filters.</div>:visibleRepos.map((repo,index)=><button className="repo-row" key={repo.id} onClick={()=>setDetailsRepo(repo)}><span className="repo-name"><b className={index<3?'medal':''}>{index<3?['01','02','03'][index]:String(index+1).padStart(2,'0')}</b><span><strong>{repo.name}</strong><small>{repo.description||'No description'}</small></span></span><span className="language-cell"><i style={{background:repo.language==='TypeScript'?'#3178c6':repo.language==='JavaScript'?'#f1e05a':repo.language==='Rust'?'#dea584':'#42d7c7'}}/>{repo.language||'—'}</span><span className="number-cell">★ {repo.stars}<em style={{width:`${starRatio(repo.stars,maxStars)}%`}}/></span><span className="number-cell">⑂ {repo.forks}</span><span className="updated-cell">{relative(repo.updatedAt)}</span></button>)}</div><div className="rank-aside"><div className="aside-title">Top stars <span>snapshot</span></div>{topRepos.map((repo)=><div className="bar-row" key={repo.id}><div><span>{repo.name}</span><b>{repo.stars}</b></div><div className="bar"><i style={{width:`${starRatio(repo.stars,maxStars)}%`}}/></div></div>)}<div className="history-line"><span>star history</span><div className="sparkline">{recentSamples.map((sample)=><i key={sample.date} style={{height:`${Math.max(8,starRatio(sample.stars,maxHistoricalStars))}%`}}/>)}</div><small>{recentSamples.length?`Latest ${recentSamples.length} snapshot(s)`:'waiting for first sample'}</small></div></div></div></section>
      <section id="activity" className="section activity-section"><div className="container"><SectionHead index="04" title={t.activity} intro="Recent public events with the coverage window shown beside them."/><div className="activity-grid"><div className="event-stream">{snapshot?.events.length ? snapshot.events.slice(0,8).map((event)=><div className="event-row" key={event.id}><span className="event-symbol">{eventIcon(event.type)}</span><div><strong>{event.type.replace('Event','')}</strong><p>{event.summary}</p></div><time>{relative(event.date)}</time></div>): <div className="empty-state">No public activity in the current snapshot.</div>}<small className="coverage">coverage: {snapshot?.coverage.eventStart?new Date(snapshot.coverage.eventStart).toLocaleDateString():'—'} → {snapshot?.coverage.eventEnd?new Date(snapshot.coverage.eventEnd).toLocaleDateString():'—'}</small></div><div className="commit-terminal"><div className="terminal-head"><span/><span/><span/><code>recent commits</code></div>{repos.slice(0,8).map((repo)=><div className="commit-line" key={repo.id}><b>{snapshot?.commitsByRepo[repo.name]?.sha?.slice(0,7)||'-------'}</b><span>{snapshot?.commitsByRepo[repo.name]?.message||'No recent commit'}</span><small>{repo.name}</small></div>)}</div></div></div></section>
      <section id="timeline" className="section container"><SectionHead index="05" title={t.timeline} intro="Repository creation and captured release milestones."/><div className="timeline-toggle"><button className="button ghost" onClick={()=>setTimelineReverse((value)=>!value)}>{timelineReverse?'Newest first':'Oldest first'} <ChevronDown size={15}/></button></div><div className="timeline">{timeline.map((entry)=><div className="timeline-item" key={entry.id}><span className="timeline-dot"/><time>{new Date(entry.date).toLocaleDateString()}</time><div><strong><a href={entry.url} target="_blank" rel="noreferrer">{entry.name}</a></strong><p>{entry.description||(lang==='zh'?'仓库创建':'Repository created')}</p></div></div>)}</div></section>
      <section id="contact" className="section contact-section"><div className="container contact-inner"><div><p className="eyebrow">06 / contact</p><h2>Build quietly.<br/><span>Ship clearly.</span></h2></div><div className="contact-links"><a href={site.github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub <ExternalLink size={14}/></a><a href={site.gitee} target="_blank" rel="noreferrer">◇ Gitee <ExternalLink size={14}/></a>{site.email&&<button onClick={copyEmail}><Copy size={17}/> {copied?'Copied':site.email}</button>}</div></div></section>
    </main>
    <footer className="footer"><span>© {new Date().getFullYear()} {site.name}</span><span>Powered by GitHub API · public snapshot</span><WebAppStatus lang={lang}/><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>back to top ↑</button></footer>
    {commandOpen&&<div className="overlay" onMouseDown={()=>setCommandOpen(false)}>
      <div className="command-panel" role="dialog" aria-label={lang==='zh'?'命令面板':'Command palette'} onMouseDown={(event)=>event.stopPropagation()}>
        <form className="command-input" onSubmit={(event)=>{event.preventDefault();if(filteredActions[0])command(filteredActions[0].id)}}>
          <Command size={17}/>
          <input autoFocus aria-label={lang==='zh'?'搜索命令':'Search commands'} placeholder={lang==='zh'?'搜索命令':'Search commands'} value={commandQuery} onChange={(event)=>setCommandQuery(event.target.value)}/>
          <kbd>ESC</kbd>
        </form>
        <div className="command-list">
          {filteredActions.map((action)=><button key={action.id} onClick={()=>command(action.id)}>{action[lang]}</button>)}
          {filteredActions.length===0&&<div className="empty-state">{lang==='zh'?'没有匹配的命令':'No commands found'}</div>}
        </div>
      </div>
    </div>}
    {terminalOpen&&<div className="mini-terminal"><div className="terminal-head"><span/><span/><span/><button aria-label={t.close} onClick={()=>setTerminalOpen(false)}><X size={14}/></button></div><div className="terminal-output" role="status">{terminalOutput}</div><form onSubmit={terminalSubmit}><span>›</span><input autoFocus value={terminalInput} onChange={(event)=>setTerminalInput(event.target.value)} aria-label="Terminal command"/></form></div>}
    {detailsRepo&&<div className="overlay" onMouseDown={()=>setDetailsRepo(null)}><aside className="detail-drawer" role="dialog" aria-labelledby="detail-title" onMouseDown={(event)=>event.stopPropagation()}><button autoFocus className="drawer-close" onClick={()=>setDetailsRepo(null)} aria-label={t.close}><X/></button><p className="eyebrow">repository detail</p><h2 id="detail-title">{detailsRepo.name}</h2><p>{detailsRepo.description}</p><div className="drawer-stats"><Metric label="Stars" value={fmtNumber(detailsRepo.stars)}/><Metric label="Forks" value={fmtNumber(detailsRepo.forks)}/><Metric label="Language" value={detailsRepo.language||'—'}/></div><div className="readme"><ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={(url,key)=>readmeUrl(url,key,detailsRepo,readme?.branch)}>{readme?.markdown||'README summary is not included in the current snapshot. Open the repository for the latest documentation.'}</ReactMarkdown></div><a className="button primary" href={detailsRepo.url} target="_blank" rel="noreferrer"><Github size={15}/> Open repository</a></aside></div>}
  </div>
}
function Metric({label,value}:{label:string;value:string}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
function SectionHead({index,title,intro}:{index:string;title:string;intro:string}){return <div className="section-head"><span className="section-index">{index}</span><div><h2>{title}</h2><p>{intro}</p></div></div>}
function DemoPanel({projectId,color}:{projectId:string;color:string}){const [step,setStep]=useState(0);useEffect(()=>{const timer=window.setInterval(()=>setStep((value)=>(value+1)%4),1800);return()=>window.clearInterval(timer)},[]);const logs=projectId==='aa-browser'?['snapshot()','click(ref=12)','type(ref=7, "hello")','extract(ref=4)']:projectId==='project-nexus'?['scan repository','create isolated worktree','review diff','await approval']:['load question set','run local model','score with rubric','write report'];return <div className="demo-frame" style={{'--demo-color':color} as CSSProperties}><div className="demo-top"><span className="demo-dot"/><span>{projectId==='aa-browser'?'agent browser':projectId==='project-nexus'?'repository control room':'evaluation console'}</span><small>demo mode</small></div><div className="demo-body"><div className="demo-scene"><div className="scene-grid"/><div className="scene-cursor" style={{left:`${28+step*16}%`,top:`${32+(step%2)*22}%`}}/><div className="scene-ref">ref={7+step}</div><div className="scene-button">{step===2?'selected':'interactive surface'}</div></div><div className="demo-log">{logs.map((log,index)=><p className={index===step?'active':''} key={log}><span>{index===step?'●':'○'}</span>{log}</p>)}</div></div><div className="demo-caption">Interactive demo · sample data <span>{step+1}/4</span></div></div>}
export default App;
