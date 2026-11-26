import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';

const PORT = Number(process.env.PORT || 8787);
const UPSTREAM_ORIGIN = 'https://api.github.com';
const CACHE_TTL_MS = Math.min(300000, Math.max(1000, Number(process.env.CACHE_TTL_MS || 60000)));
const USER_AGENT = 'yuchen0x1-portfolio-proxy';
const ALLOWED_QUERY_KEYS = new Set(['page', 'per_page', 'type', 'sort', 'direction']);

export function isAllowedMethod(method) {
  return method === 'GET' || method === 'OPTIONS';
}

export function isAllowedPath(pathname) {
  if (pathname === '/users/yuchen0x1' || pathname === '/users/yuchen0x1/repos' || pathname === '/users/yuchen0x1/events/public') return true;
  return /^\/repos\/yuchen0x1\/[A-Za-z0-9_.-]+\/(languages|releases\/latest|commits|readme)$/.test(pathname);
}

export function hasAllowedQuery(searchParams) {
  const valid = {
    page: (value) => /^[1-9]\d*$/.test(value) && Number(value)<=10,
    per_page: (value) => /^[1-9]\d*$/.test(value) && Number(value)<=100,
    type: (value) => ['owner','all'].includes(value),
    sort: (value) => ['updated','created','pushed','full_name'].includes(value),
    direction: (value) => ['asc','desc'].includes(value),
  };
  return [...searchParams.keys()].every((key) =>
    ALLOWED_QUERY_KEYS.has(key) && searchParams.getAll(key).length===1 && valid[key](searchParams.get(key)));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'If-None-Match, Content-Type',
    Vary: 'Origin',
  };
}

function writeJson(response, status, body, extra = {}) {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(), ...extra});
  response.end(JSON.stringify(body));
}

export function createProxyServer({fetchImpl = fetch, now = () => Date.now()} = {}) {
  const cache = new Map();
  return createServer(async (request, response) => {
    if (!isAllowedMethod(request.method)) {
      writeJson(response, 405, {error: 'method not allowed'}, {'Allow': 'GET, OPTIONS'});
      return;
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders());
      response.end();
      return;
    }
    let url;
    try {
      url = new URL(request.url || '/', 'http://localhost');
    } catch {
      writeJson(response, 400, {error:'invalid request URL'});
      return;
    }
    if (url.href.length>1024) {
      writeJson(response, 414, {error:'request URL too long'});
      return;
    }
    if (!isAllowedPath(url.pathname) || !hasAllowedQuery(url.searchParams)) {
      writeJson(response, 404, {error: 'route not allowed'});
      return;
    }
    const key = `${url.pathname}${url.search}`;
    const previous = cache.get(key);
    if (previous && previous.expiresAt>now()) {
      if (request.headers['if-none-match']===previous.etag) {
        response.writeHead(304,{...corsHeaders(),ETag:previous.etag});
        response.end();
      } else {
        writeJson(response,200,previous.body,{ETag:previous.etag,'X-Proxy-Cache':'hit'});
      }
      return;
    }
    const headers = {Accept: 'application/vnd.github+json', 'User-Agent': USER_AGENT};
    if (previous?.etag) headers['If-None-Match'] = previous.etag;
    try {
      const upstream = await fetchImpl(`${UPSTREAM_ORIGIN}${key}`, {headers,signal:AbortSignal.timeout(10000),redirect:'error'});
      if (upstream.status === 304 && previous) {
        previous.expiresAt = now() + CACHE_TTL_MS;
        if (request.headers['if-none-match'] === previous.etag) {
          response.writeHead(304, {...corsHeaders(), ETag: previous.etag, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'});
          response.end();
        } else {
          writeJson(response, 200, previous.body, {ETag: previous.etag, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'});
        }
        return;
      }
      if (!upstream.ok) {
        writeJson(response, upstream.status === 403 || upstream.status === 429 ? 503 : upstream.status, {error: `upstream ${upstream.status}`}, {'Retry-After': '60'});
        return;
      }
      const body = await upstream.json();
      const etag = upstream.headers.get('etag') || `W/"${Buffer.from(JSON.stringify(body)).byteLength}-${now()}"`;
      cache.set(key, {body, etag, expiresAt: now() + CACHE_TTL_MS});
      if (cache.size>200) cache.delete(cache.keys().next().value);
      writeJson(response, 200, body, {ETag: etag, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'});
    } catch {
      if (previous && previous.expiresAt + 300000 > now()) {
        writeJson(response, 200, previous.body, {ETag: previous.etag, 'X-Proxy-Cache': 'stale', 'Cache-Control': 'public, max-age=30'});
        return;
      }
      writeJson(response, 502, {error: 'upstream unavailable'});
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createProxyServer().listen(PORT, '127.0.0.1', () => console.log(`portfolio proxy listening on http://127.0.0.1:${PORT}`));
}
