const API_ORIGIN = 'https://api.github.com';

export function createClient({fetchImpl = fetch, cache = {}, token = '', sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), maxRetries = 2} = {}) {
  async function get(path) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) throw new Error('path must be a relative GitHub API path');
    const cached = cache[path];
    const headers = {'Accept':'application/vnd.github+json','User-Agent':'yuchen0x1-portfolio-collector'};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cached?.etag) headers['If-None-Match'] = cached.etag;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await fetchImpl(`${API_ORIGIN}${path}`, {headers});
      if (response.status === 304) {
        if (!cached || !('body' in cached)) throw new Error(`304 without cached body for ${path}`);
        client.lastResponse = {status:304, headers:response.headers, fromCache:true};
        return cached.body;
      }
      if (response.status === 429 || response.status === 403) {
        if (response.status === 403) throw new Error(`GitHub API 403 for ${path}`);
        if (attempt >= maxRetries) throw new Error(`GitHub API 429 for ${path}`);
        const retryAfter = Number(response.headers.get('retry-after') || 1);
        await sleep(Math.min(10000, Math.max(0, retryAfter * 1000)));
        continue;
      }
      if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}`);
      const data = await response.json();
      cache[path] = {etag: response.headers.get('etag') || undefined, body:data};
      client.lastResponse = {status:response.status, headers:response.headers, fromCache:false};
      return data;
    }
    throw new Error(`GitHub API retry limit reached for ${path}`);
  }
  const client = {get, lastResponse:null};
  return client;
}
