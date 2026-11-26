import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {createProxyServer, hasAllowedQuery, isAllowedMethod, isAllowedPath} from '../examples/proxy/server.mjs';

test('proxy only accepts read methods', () => {
  assert.equal(isAllowedMethod('GET'), true);
  assert.equal(isAllowedMethod('OPTIONS'), true);
  assert.equal(isAllowedMethod('POST'), false);
  assert.equal(isAllowedMethod('DELETE'), false);
});

test('proxy allowlists fixed yuchen0x1 GitHub routes', () => {
  assert.equal(isAllowedPath('/users/yuchen0x1'), true);
  assert.equal(isAllowedPath('/users/yuchen0x1/repos'), true);
  assert.equal(isAllowedPath('/repos/yuchen0x1/aa-browser/readme'), true);
  assert.equal(isAllowedPath('/repos/other-user/private-repo/readme'), false);
  assert.equal(isAllowedPath('/search/code?q=token'), false);
});

test('proxy rejects arbitrary query keys', () => {
  assert.equal(hasAllowedQuery(new URL('http://localhost/?page=1&per_page=100').searchParams), true);
  assert.equal(hasAllowedQuery(new URL('http://localhost/?q=secrets').searchParams), false);
  assert.equal(hasAllowedQuery(new URL('http://localhost/?page=1&page=2').searchParams), false);
  assert.equal(hasAllowedQuery(new URL('http://localhost/?page=999999').searchParams), false);
});

test('proxy serves fresh cached data and conditional responses without extra upstream calls', async () => {
  let calls=0;
  const server=createProxyServer({fetchImpl:async()=>{
    calls+=1;
    return Response.json({login:'yuchen0x1'},{headers:{ETag:'"one"'}});
  }});
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  try {
    const url=`http://127.0.0.1:${server.address().port}/users/yuchen0x1`;
    assert.equal((await fetch(url)).status,200);
    assert.equal((await fetch(url)).headers.get('x-proxy-cache'),'hit');
    assert.equal((await fetch(url,{headers:{'If-None-Match':'"one"'}})).status,304);
    assert.equal(calls,1);
  } finally {
    await new Promise((resolve)=>server.close(resolve));
  }
});

test('proxy rejects disallowed HTTP requests before contacting GitHub', async () => {
  let upstreamCalls = 0;
  const server = createProxyServer({fetchImpl: async () => { upstreamCalls += 1; return Response.json({}); }});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const disallowed = await fetch(`${origin}/search/code?q=token`);
  const method = await fetch(`${origin}/users/yuchen0x1`, {method:'POST'});
  assert.equal(disallowed.status, 404);
  assert.equal(method.status, 405);
  assert.equal(upstreamCalls, 0);
  await new Promise((resolve) => server.close(resolve));
});

test('proxy refreshes cache freshness after an upstream 304', async () => {
  let time=0;
  let calls=0;
  const server=createProxyServer({now:()=>time,fetchImpl:async()=>{
    calls+=1;
    return calls===1 ? Response.json({login:'yuchen0x1'},{headers:{ETag:'"one"'}})
      : new Response(null,{status:304});
  }});
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  try {
    const url=`http://127.0.0.1:${server.address().port}/users/yuchen0x1`;
    await fetch(url);
    time=300001;
    const revalidated=await fetch(url);
    assert.deepEqual(await revalidated.json(),{login:'yuchen0x1'});
    const next=await fetch(url);
    assert.equal(next.headers.get('x-proxy-cache'),'hit');
    assert.equal(calls,2);
  } finally {
    await new Promise((resolve)=>server.close(resolve));
  }
});

test('proxy returns 400 for malformed request URLs without contacting GitHub', async () => {
  let calls=0;
  const server=createProxyServer({fetchImpl:async()=>{calls+=1;return Response.json({});}});
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  try {
    const status=await new Promise((resolve,reject)=>{
      const pending=request({host:'127.0.0.1',port:server.address().port,path:'http://['},(response)=>{
        response.resume();
        response.on('end',()=>resolve(response.statusCode));
      });
      pending.on('error',reject);
      pending.end();
    });
    assert.equal(status,400);
    assert.equal(calls,0);
  } finally {
    await new Promise((resolve)=>server.close(resolve));
  }
});

test('public proxy does not forward the collector token to repository endpoints', async () => {
  const previousToken=process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN='example-collector-token';
  const server=createProxyServer({fetchImpl:async(_url,init)=>{
    assert.equal(new Headers(init.headers).has('authorization'),false);
    return Response.json({message:'Not Found'},{status:404});
  }});
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  try {
    const url=`http://127.0.0.1:${server.address().port}/repos/yuchen0x1/private-example/readme`;
    assert.equal((await fetch(url)).status,404);
  } finally {
    if (previousToken===undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN=previousToken;
    await new Promise((resolve)=>server.close(resolve));
  }
});
