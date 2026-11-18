import type { History, Snapshot } from '../types/github';
import { validateHistory, validateSnapshot } from './model';
const snapshotKey = 'yuchen0x1:snapshot';
const historyKey = 'yuchen0x1:history';
const read = <T,>(key:string):T|null => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : null; } catch { return null; } };
export interface LoadedSnapshot {snapshot:Snapshot|null;history:History|null;cached:boolean;cachedAt:string|null;checkedAt:string;error:string|null}

async function fetchData(file:string, signal?:AbortSignal):Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`, {signal, cache:'no-cache'});
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return response.json();
}

export async function loadSnapshot(signal?:AbortSignal):Promise<LoadedSnapshot> {
  const checkedAt = new Date().toISOString();
  const cachedHistory = read<unknown>(historyKey);
  const historyRequest = fetchData('history.json', signal).then(
    (value) => validateHistory(value) ? value : null,
    () => null,
  );
  try {
    const snapshot = await fetchData('repos.json', signal);
    if (!validateSnapshot(snapshot)) throw new Error('snapshot schema mismatch');
    const freshHistory = await historyRequest;
    const history = freshHistory ?? (validateHistory(cachedHistory) ? cachedHistory : null);
    const cachedAt = new Date().toISOString();
    try {
      localStorage.setItem(snapshotKey, JSON.stringify({snapshot,cachedAt}));
      if (freshHistory) localStorage.setItem(historyKey, JSON.stringify(freshHistory));
    } catch { /* storage is optional */ }
    return {snapshot,history,cached:false,cachedAt,error:null,checkedAt};
  } catch (error) {
    const stored = read<{snapshot:Snapshot;cachedAt:string}>(snapshotKey);
    const history = validateHistory(cachedHistory) ? cachedHistory : null;
    if (stored && validateSnapshot(stored.snapshot)) return {snapshot:stored.snapshot,history,cached:true,cachedAt:stored.cachedAt,error:error instanceof Error ? error.message : 'offline',checkedAt};
    return {snapshot:null,history,cached:false,cachedAt:null,error:error instanceof Error ? error.message : 'offline',checkedAt};
  }
}
