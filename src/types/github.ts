export type Language = 'zh' | 'en';
export interface Repo {
  id:number; name:string; fullName:string; description:string; url:string;
  language:string|null; topics:string[]; fork:boolean; archived:boolean;
  createdAt:string; updatedAt:string; pushedAt:string; stars:number; forks:number;
  issues:number; subscribers:number|null; defaultBranch:string;
}
export interface Release {tag:string; name:string; date:string; url:string; download:string|null}
export interface Commit {sha:string; message:string; date:string; url:string}
export interface PublicEvent {id:string; type:string; repo:string; date:string; summary:string; url:string}
export interface Snapshot {
  schemaVersion:1; username:string; generatedAt:string; lastSuccessfulAt:string;
  profile:{login:string; name:string; avatar:string; url:string; followers:number; publicRepos:number};
  repos:Repo[];
  languagesByRepo:Record<string,{bytes:Record<string,number>;collectedAt:string;stale:boolean}>;
  releasesByRepo:Record<string,Release|null>;
  commitsByRepo:Record<string,Commit|null>;
  readmesByRepo:Record<string,{markdown:string;branch:string;collectedAt:string}>;
  events:PublicEvent[];
  coverage:{complete:boolean;details:string[];failed:string[];retained:string[];eventStart:string|null;eventEnd:string|null};
  rateLimit:{remaining:number|null;limit:number|null;resetAt:string|null;observedAt:string;source:string};
}
export interface History {schemaVersion:1;samples:{date:string;stars:number;forks:number;repos:Record<string,number>}[]}
export type Sort = 'stars'|'forks'|'updatedAt'|'createdAt'|'name';
export interface Filters {sort:Sort;direction:'asc'|'desc';query:string;language:string;topic:string;hideForks:boolean;hideArchived:boolean}
export const defaultFilters:Filters={sort:'stars',direction:'desc',query:'',language:'all',topic:'all',hideForks:true,hideArchived:true};
