import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source=await readFile(new URL('../scripts/service-worker.js',import.meta.url),'utf8');
function worker({rejectInstall=false}={}) {
  const handlers=new Map();
  const removed=[];
  let activated=0;
  let installationRequests=[];
  const self={
    registration:{scope:'https://portfolio.test/lab/'},
    clients:{claim:async()=>{}},
    skipWaiting:async()=>{activated+=1},
    addEventListener:(name,handler)=>handlers.set(name,handler),
  };
  const caches={
    open:async()=>({
      addAll:async(requests)=>{
        installationRequests=requests;
        if(rejectInstall) throw new Error('Integrity check failed');
      },
    }),
    keys:async()=>['portfolio:/lab/:old','another-app-cache'],
    delete:async(key)=>removed.push(key),
  };
  runInNewContext(source,{self,caches,URL,Request,BUILD:'new',SHELL:[{path:'index.html',integrity:'sha256-example'}],fetch});
  const dispatch=async(name,data={})=>{
    let promise;
    handlers.get(name)({...data,waitUntil:(pending)=>{promise=pending}});
    await promise;
  };
  return {dispatch,removed,get activated(){return activated},get requests(){return installationRequests}};
}

test('failed offline installation preserves the previous worker and cache',async()=>{
  const app=worker({rejectInstall:true});
  await assert.rejects(app.dispatch('install'),/Integrity/);
  assert.equal(app.activated,0);
  assert.deepEqual(app.removed,[]);
  assert.equal(app.requests[0].url,'https://portfolio.test/lab/index.html');
  assert.equal(app.requests[0].integrity,'sha256-example');
});

test('worker activates after the explicit update message and preserves unrelated caches',async()=>{
  const app=worker();
  await app.dispatch('install');
  assert.equal(app.activated,0);
  await app.dispatch('message',{data:'activate-portfolio-update'});
  assert.equal(app.activated,1);
  await app.dispatch('activate');
  assert.deepEqual(app.removed,['portfolio:/lab/:old']);
});
