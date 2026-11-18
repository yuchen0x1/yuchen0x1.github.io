import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient, GitHubApiError} from './github-client.mjs';
import {recordHistory} from './history.mjs';

const username = 'yuchen0x1';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataDir = resolve(root, 'public/data');
const cachePath = resolve(root, '.cache/github.json');
const featured = ['aa-browser', 'PROJECT-NEXUS', 'mind-bench'];

async function readJson(path, fallback) { try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; } }
async function writeAtomic(path, value) { await mkdir(dirname(path), {recursive:true}); const tmp = `${path}.tmp`; await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(tmp, path); }
function iso(value) { return value ? new Date(value).toISOString() : ''; }
function languageMap(repo, data, now) { return {bytes:data || {}, collectedAt:now, stale:false}; }
function normalizeRepo(repo) {
  return {id:repo.id,name:repo.name,fullName:repo.full_name,description:repo.description || '',url:repo.html_url,language:repo.language || null,topics:repo.topics || [],fork:Boolean(repo.fork),archived:Boolean(repo.archived),createdAt:iso(repo.created_at),updatedAt:iso(repo.updated_at),pushedAt:iso(repo.pushed_at),stars:Number(repo.stargazers_count || 0),forks:Number(repo.forks_count || 0),issues:Number(repo.open_issues_count || 0),subscribers:typeof repo.subscribers_count === 'number' ? repo.subscribers_count : null,defaultBranch:repo.default_branch || 'main'};
}
function normalizeEvent(event) {
  const repo = event.repo?.name || '';
  const actor = event.actor?.display_login || event.actor?.login || 'unknown';
  const type = event.type || 'Event';
  return {id:String(event.id),type,repo,date:iso(event.created_at),summary:`${actor} ${type.replace(/Event$/,'').toLowerCase()} ${repo}`,url:`https://github.com/${repo}`};
}

async function main() {
  const cache = await readJson(cachePath, {});
  const previous = await readJson(resolve(dataDir, 'repos.json'), null);
  const history = await readJson(resolve(dataDir, 'history.json'), {schemaVersion:1,samples:[]});
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const client = createClient({cache, token});
  const now = new Date().toISOString();
  const failed = [], retained = [], details = [];
  const get = async (path, label, {required = false, missing} = {}) => {
    try { return await client.get(path); }
    catch (error) {
      if (error instanceof GitHubApiError && error.status === missing) return null;
      if (required) throw error;
      failed.push(`${label}: ${error.message}`);
    }
  };
  const keepPrevious = (value, label) => {
    if (value != null) retained.push(label);
    return value ?? null;
  };
  const profile = await get(`/users/${username}`, 'profile', {required:true});
  const repoRaw = [];
  for (let page = 1; page <= 10; page += 1) {
    const pageData = await get(`/users/${username}/repos?per_page=100&type=owner&sort=updated&page=${page}`, `repos page ${page}`, {required:true});
    repoRaw.push(...pageData);
    if (pageData.length < 100) break;
  }
  const repos = repoRaw.map(normalizeRepo);
  const languagesByRepo = {}, releasesByRepo = {}, commitsByRepo = {}, readmesByRepo = {};
  for (const repo of repos) {
    const language = await get(`/repos/${username}/${repo.name}/languages`, `${repo.name} languages`);
    if (language) languagesByRepo[String(repo.id)] = languageMap(repo, language, now); else if (previous?.languagesByRepo?.[String(repo.id)]) {languagesByRepo[String(repo.id)] = {...previous.languagesByRepo[String(repo.id)], stale:true}; retained.push(`${repo.name} languages`);}
    const release = await get(`/repos/${username}/${repo.name}/releases/latest`, `${repo.name} release`, {missing:404});
    releasesByRepo[repo.name] = release ? {tag:release.tag_name || release.name || '',name:release.name || release.tag_name || '',date:iso(release.published_at || release.created_at),url:release.html_url,download:release.assets?.[0]?.browser_download_url || null}
      : release === undefined ? keepPrevious(previous?.releasesByRepo?.[repo.name], `${repo.name} release`) : null;
    const commits = await get(`/repos/${username}/${repo.name}/commits?per_page=1`, `${repo.name} commit`, {missing:409});
    const commit = commits?.[0];
    commitsByRepo[repo.name] = commit ? {sha:commit.sha,message:(commit.commit?.message || '').split('\n')[0],date:iso(commit.commit?.author?.date),url:commit.html_url}
      : commits === undefined ? keepPrevious(previous?.commitsByRepo?.[repo.name], `${repo.name} commit`) : null;
    if (featured.includes(repo.name)) {
      const readme = await get(`/repos/${username}/${repo.name}/readme`, `${repo.name} README`, {missing:404});
      if (readme?.content) readmesByRepo[repo.name] = {markdown:Buffer.from(readme.content, 'base64').toString('utf8'),branch:repo.defaultBranch,collectedAt:now};
      else if (readme !== null && previous?.readmesByRepo?.[repo.name]) {readmesByRepo[repo.name] = previous.readmesByRepo[repo.name]; retained.push(`${repo.name} README`);}
    }
  }
  const eventsRaw = await get(`/users/${username}/events/public?per_page=100&page=1`, 'public events');
  const events = eventsRaw?.map(normalizeEvent) ?? keepPrevious(previous?.events, 'public events') ?? [];
  const snapshot = {schemaVersion:1,username,generatedAt:now,lastSuccessfulAt:now,profile:{login:profile.login,name:profile.name || username,avatar:profile.avatar_url || '',url:profile.html_url || `https://github.com/${username}`,followers:Number(profile.followers || 0),publicRepos:Number(profile.public_repos || repos.length)},repos,languagesByRepo,releasesByRepo,commitsByRepo,readmesByRepo,events,coverage:{complete:failed.length === 0,details,failed,retained,eventStart:events.at(-1)?.date || null,eventEnd:events[0]?.date || null},rateLimit:{remaining:Number(client.lastResponse?.headers?.get('x-ratelimit-remaining') || NaN) || null,limit:Number(client.lastResponse?.headers?.get('x-ratelimit-limit') || NaN) || null,resetAt:client.lastResponse?.headers?.get('x-ratelimit-reset') ? new Date(Number(client.lastResponse.headers.get('x-ratelimit-reset')) * 1000).toISOString() : null,observedAt:now,source:token ? 'github-authenticated' : 'github-public'}};
  const nextHistory = recordHistory(history, snapshot);
  await writeAtomic(resolve(dataDir, 'repos.json'), snapshot);
  await writeAtomic(resolve(dataDir, 'history.json'), nextHistory);
  await writeAtomic(cachePath, cache);
  console.log(JSON.stringify({generatedAt:now,repos:repos.length,events:events.length,failed:failed.length,retained:retained.length}, null, 2));
}

main().catch(async (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
