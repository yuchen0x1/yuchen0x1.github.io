const API_ORIGIN = 'https://api.github.com';

export class GitHubApiError extends Error {
  constructor(status, path) {
    super(`GitHub API ${status} for ${path}`);
    this.status = status;
  }
}

export function createClient({fetchImpl = fetch, cache = {}, token = '', sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), maxRetries = 2, requestTimeoutMs = 20000} = {}) {
  async function get(path) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) throw new Error('path must be a relative GitHub API path');
    const cached = cache[path];
    const headers = {'Accept':'application/vnd.github+json','User-Agent':'yuchen0x1-portfolio-collector'};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cached?.etag) headers['If-None-Match'] = cached.etag;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await fetchImpl(`${API_ORIGIN}${path}`, {headers,signal:AbortSignal.timeout(requestTimeoutMs),redirect:'error'});
      client.lastResponse = {status:response.status, headers:response.headers, fromCache:response.status === 304};
      if (response.status === 304) {
        if (!cached || !('body' in cached)) throw new Error(`304 without cached body for ${path}`);
        return cached.body;
      }
      if (response.status === 429 || response.status === 403) {
        if (response.status === 403 || attempt >= maxRetries) throw new GitHubApiError(response.status, path);
        const retryAfter = Number(response.headers.get('retry-after') || 1);
        await sleep(Math.min(10000, Math.max(0, retryAfter * 1000)));
        continue;
      }
      if (!response.ok) throw new GitHubApiError(response.status, path);
      const data = await response.json();
      cache[path] = {etag: response.headers.get('etag') || undefined, body:data};
      return data;
    }
    throw new Error(`GitHub API retry limit reached for ${path}`);
  }
  const client = {get, lastResponse:null};
  return client;
}
