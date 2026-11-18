/* global self, caches, BUILD, SHELL */
const scope = new URL(self.registration.scope);
const cachePrefix = `portfolio:${scope.pathname}:`;
const cacheName = cachePrefix + BUILD;
const shellFiles = new Set(SHELL.map(({path})=>new URL(path,scope).href));
const indexUrl = new URL('index.html',scope).href;

self.addEventListener('install',(event)=>{
  const requests = SHELL.map(({path,integrity})=>new Request(new URL(path,scope), {
    cache:'reload',
    integrity,
    mode:'same-origin',
    redirect:'error',
  }));
  event.waitUntil(caches.open(cacheName).then((cache)=>cache.addAll(requests)));
});

self.addEventListener('activate',(event)=>{
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter((key)=>key.startsWith(cachePrefix)&&key!==cacheName).map((key)=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',(event)=>{
  if (event.data === 'activate-portfolio-update') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch',(event)=>{
  const {request}=event;
  if (request.method!=='GET') return;
  const url=new URL(request.url);
  if (url.origin!==scope.origin) return;

  let cacheKey;
  if (request.mode==='navigate' && (url.pathname===scope.pathname || url.pathname===new URL(indexUrl).pathname)) {
    cacheKey=indexUrl;
  } else if (shellFiles.has(url.href)) {
    cacheKey=url.href;
  }
  if (cacheKey) {
    event.respondWith(caches.open(cacheName).then((cache)=>cache.match(cacheKey)).then((cached)=>cached||fetch(request)));
  }
});
