import type { Filters, Repo, Snapshot } from '../types/github';

export function selectRepos(repos:Repo[], filters:Filters):Repo[] {
  const query = filters.query.trim().toLowerCase();
  const filtered = repos.filter((repo) => {
    if (filters.hideForks && repo.fork) return false;
    if (filters.hideArchived && repo.archived) return false;
    if (filters.language !== 'all' && repo.language !== filters.language) return false;
    if (filters.topic !== 'all' && !repo.topics.includes(filters.topic)) return false;
    if (!query) return true;
    return `${repo.name} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase().includes(query);
  });
  const direction = filters.direction === 'asc' ? 1 : -1;
  return filtered.sort((a, b) => {
    let result = 0;
    if (filters.sort === 'stars') result = a.stars - b.stars;
    if (filters.sort === 'forks') result = a.forks - b.forks;
    if (filters.sort === 'updatedAt') result = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
    if (filters.sort === 'createdAt') result = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (filters.sort === 'name') result = a.name.localeCompare(b.name);
    if (result === 0) return a.name.localeCompare(b.name) || a.id - b.id;
    return result * direction;
  });
}

export function summarize(repos:Repo[]) {
  return {
    stars: repos.reduce((sum, repo) => sum + repo.stars, 0),
    forks: repos.reduce((sum, repo) => sum + repo.forks, 0),
    count: repos.length,
    active: repos.filter((repo) => Date.now() - Date.parse(repo.pushedAt) < 30 * 86400000).length,
  };
}

export function starRatio(stars:number, max:number) {
  return max > 0 ? Math.min(100, Math.max(0, (stars / max) * 100)) : 0;
}

export function changes(oldRepos:Repo[]|null, nextRepos:Repo[]) {
  if (!oldRepos) return {};
  const rank = (repos:Repo[]) => [...repos].sort((a,b) => b.stars - a.stars || a.name.localeCompare(b.name)).map((repo) => repo.id);
  const oldRank = rank(oldRepos);
  const nextRank = rank(nextRepos);
  const oldById = new Map(oldRepos.map((repo) => [String(repo.id), repo]));
  const result:Record<string,{stars:number;rank:number;isNew:boolean}> = {};
  for (const [index, repo] of nextRank.map((id) => nextRepos.find((item) => item.id === id)!).entries()) {
    const previous = oldById.get(String(repo.id));
    const starDelta = previous ? repo.stars - previous.stars : 0;
    const rankDelta = previous ? oldRank.indexOf(repo.id) - index : 0;
    if (!previous || starDelta !== 0 || rankDelta !== 0) result[String(repo.id)] = {stars:starDelta,rank:rankDelta,isNew:!previous};
  }
  return result;
}

export function validateSnapshot(value:unknown):value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Snapshot>;
  return candidate.schemaVersion === 1 && typeof candidate.username === 'string' && Array.isArray(candidate.repos) &&
    typeof candidate.profile === 'object' && candidate.profile !== null && Array.isArray(candidate.events) &&
    typeof candidate.generatedAt === 'string' && typeof candidate.lastSuccessfulAt === 'string';
}
