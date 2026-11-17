import { describe,it,expect } from 'vitest';
import { selectRepos, summarize, changes, starRatio, validateSnapshot } from '../src/services/model';
import { defaultFilters, type Repo } from '../src/types/github';
const repo=(id:number,name:string,stars:number,extra:Partial<Repo>={}):Repo=>({id,name,stars,fullName:`u/${name}`,description:'Agent tool',url:`https://github.com/u/${name}`,language:'TypeScript',topics:['ai'],fork:false,archived:false,createdAt:'2026-01-01',updatedAt:'2026-11-01',pushedAt:'2026-11-01',forks:0,issues:0,subscribers:null,defaultBranch:'main',...extra});
describe('repository data behavior',()=>{
  it('combines filters and excludes forked and archived repos',()=>{
    const input=[repo(1,'alpha',2),repo(2,'beta',5),repo(3,'fork',9,{fork:true}),repo(4,'old',8,{archived:true}),repo(5,'other',9,{language:'Go'})];
    expect(selectRepos(input,{...defaultFilters,language:'TypeScript',topic:'ai',query:'agent'}).map(r=>r.name)).toEqual(['beta','alpha']);
    expect(input[0].name).toBe('alpha');
  });
  it('uses deterministic name order for tied stars',()=>expect(selectRepos([repo(1,'zeta',0),repo(2,'alpha',0)],defaultFilters).map(r=>r.name)).toEqual(['alpha','zeta']));
  it('sorts ascending names without reversing ties',()=>expect(selectRepos([repo(1,'zeta',4),repo(2,'alpha',1)],{...defaultFilters,sort:'name',direction:'asc'}).map(r=>r.name)).toEqual(['alpha','zeta']));
  it('never divides by zero for star bars',()=>{expect(starRatio(0,0)).toBe(0);expect(starRatio(5,10)).toBe(50)});
  it('summarizes account totals without hiding zero-star repos',()=>expect(summarize([repo(1,'a',3,{forks:2}),repo(2,'b',0)])).toMatchObject({stars:3,forks:2,count:2}));
  it('compares real snapshots without inventing first-load growth',()=>{
    expect(changes(null,[repo(1,'a',3)])).toEqual({});
    expect(changes([repo(1,'a',3),repo(2,'b',2)],[repo(1,'a',3),repo(2,'b',4)])['2']).toEqual({stars:2,rank:1,isNew:false});
  });
  it('rejects corrupt or malicious snapshot values',()=>{
    expect(validateSnapshot({schemaVersion:1,repos:[]})).toBe(false);
    expect(validateSnapshot(null)).toBe(false);
  });
});
