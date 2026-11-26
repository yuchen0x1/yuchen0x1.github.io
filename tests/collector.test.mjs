import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '../scripts/github-client.mjs';
import {recordHistory} from '../scripts/history.mjs';
test('304 uses the persisted matching response body',async()=>{
  const cache={'/users/yuchen0x1':{etag:'"abc"',body:{login:'yuchen0x1'}}};
  const client=createClient({cache,fetchImpl:async(_url,init)=>{assert.equal(init.headers['If-None-Match'],'"abc"');return new Response(null,{status:304})}});
  assert.deepEqual(await client.get('/users/yuchen0x1'),{login:'yuchen0x1'});
});
test('304 without saved body does not invent data',async()=>{
  const client=createClient({fetchImpl:async()=>new Response(null,{status:304})});
  await assert.rejects(()=>client.get('/users/yuchen0x1'),/304/);
});
test('403 limit failure propagates rather than replacing data with zeroes',async()=>{
  const client=createClient({fetchImpl:async()=>new Response('{"message":"limit"}',{status:403,headers:{'x-ratelimit-remaining':'0'}})});
  await assert.rejects(()=>client.get('/users/yuchen0x1'),/403/);
  assert.equal(client.lastResponse.status,403);
  assert.equal(client.lastResponse.headers.get('x-ratelimit-remaining'),'0');
});
test('429 retries once after retry-after and returns actual body',async()=>{
  let n=0;const waits=[];
  const client=createClient({sleep:async(ms)=>waits.push(ms),fetchImpl:async()=>++n===1?new Response('{}',{status:429,headers:{'retry-after':'1'}}):Response.json({login:'yuchen0x1'})});
  assert.deepEqual(await client.get('/users/yuchen0x1'),{login:'yuchen0x1'});assert.deepEqual(waits,[1000]);
});
test('credentials cannot be sent to arbitrary URLs',async()=>{
  const client=createClient({token:'example-only',fetchImpl:async()=>{throw new Error('should not fetch')}});
  await assert.rejects(()=>client.get('https://evil.example/'),/path/);
});
test('collector aborts stalled upstream requests and refuses redirects',async()=>{
  const client=createClient({requestTimeoutMs:5,fetchImpl:(_url,init)=>new Promise((_resolve,reject)=>{
    assert.equal(init.redirect,'error');
    const timer=setTimeout(()=>reject(new Error('request did not abort')),1000);
    init.signal.addEventListener('abort',()=>{
      clearTimeout(timer);
      reject(init.signal.reason);
    },{once:true});
  })});
  await assert.rejects(()=>client.get('/users/yuchen0x1'),{name:'TimeoutError'});
});
test('same history bucket is replaced and past values stay literal',()=>{
  const snapshot={generatedAt:'2026-11-18T01:04:00Z',repos:[{name:'a',stars:3,forks:1}]};
  let h=recordHistory({schemaVersion:1,samples:[]},snapshot);
  h=recordHistory(h,{...snapshot,generatedAt:'2026-11-18T01:17:00Z',repos:[{name:'a',stars:4,forks:1}]});
  assert.equal(h.samples.length,1);assert.equal(h.samples[0].stars,4);
  h=recordHistory(h,{...snapshot,generatedAt:'2026-11-18T01:34:00Z'});
  assert.equal(h.samples.length,2);assert.equal(h.samples[0].stars,4);assert.equal(h.samples[1].stars,3);
});
