import type { History, Snapshot } from '../types/github';
import { validateSnapshot } from './model';
const snapshotKey = 'yuchen0x1:snapshot';
const historyKey = 'yuchen0x1:history';
const read = <T,>(key:string):T|null => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : null; } catch { return null; } };
export interface LoadedSnapshot {snapshot:Snapshot|null;history:History|null;cached:boolean;cachedAt:string|null;checkedAt:string;error:string|null}
export async function loadSnapshot(signal?:AbortSignal):Promise<LoadedSnapshot> {
  const checkedAt = new Date().toISOString();
  try {
    const dataPath = (file:string) => `${import.meta.env.BASE_URL}data/${file}`;
    const [snapshotResponse, historyResponse] = await Promise.all([fetch(dataPath('repos.json'), {signal, cache:'no-cache'}), fetch(dataPath('history.json'), {signal, cache:'no-cache'})]);
    if (!snapshotResponse.ok) throw new Error(`snapshot ${snapshotResponse.status}`);
    const snapshot:unknown = await snapshotResponse.json();
    if (!validateSnapshot(snapshot)) throw new Error('snapshot schema mismatch');
    const history = historyResponse.ok ? await historyResponse.json() as History : null;
    const cachedAt = new Date().toISOString();
    try { localStorage.setItem(snapshotKey, JSON.stringify({snapshot,cachedAt})); if (history) localStorage.setItem(historyKey, JSON.stringify(history)); } catch { /* storage is optional */ }
    return {snapshot,history,cached:false,cachedAt,error:null,checkedAt};
  } catch (error) {
    const stored = read<{snapshot:Snapshot;cachedAt:string}>(snapshotKey);
    const history = read<History>(historyKey);
    if (stored && validateSnapshot(stored.snapshot)) return {snapshot:stored.snapshot,history,cached:true,cachedAt:stored.cachedAt,error:error instanceof Error ? error.message : 'offline',checkedAt};
    return {snapshot:null,history,cached:false,cachedAt:null,error:error instanceof Error ? error.message : 'offline',checkedAt};
  }
}
