import {afterEach, expect, it, vi} from 'vitest';
import {loadSnapshot} from '../src/services/snapshot';

const date = '2026-11-18T09:00:00Z';
const snapshot = {
  schemaVersion:1,
  username:'yuchen0x1',
  generatedAt:date,
  lastSuccessfulAt:date,
  profile:{login:'yuchen0x1',name:'yuchen0x1',avatar:'',followers:0,publicRepos:0},
  coverage:{complete:true},
  repos:[],
  events:[],
  commitsByRepo:{},
  releasesByRepo:{},
  readmesByRepo:{},
};
const history = {schemaVersion:1,samples:[{date,stars:0,forks:0,repos:{}}]};

function serveSnapshots(repos:Response, samples:Response) {
  vi.stubGlobal('fetch', vi.fn(async (url:string) => url.endsWith('repos.json') ? repos : samples));
}

afterEach(()=>{
  localStorage.clear();
  vi.unstubAllGlobals();
});

it('loads the repository snapshot when star history is corrupt', async ()=>{
  serveSnapshots(Response.json(snapshot), Response.json({schemaVersion:1,samples:{}}));
  const loaded = await loadSnapshot();
  expect(loaded).toMatchObject({snapshot,history:null,cached:false,error:null});
});

it('recovers from an incomplete repository snapshot using the last good cache', async ()=>{
  serveSnapshots(Response.json(snapshot), Response.json(history));
  await loadSnapshot();

  serveSnapshots(Response.json({...snapshot,coverage:null}), new Response('unavailable', {status:503}));
  const loaded = await loadSnapshot();
  expect(loaded).toMatchObject({snapshot,history,cached:true,error:'snapshot schema mismatch'});
});
