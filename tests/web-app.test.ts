import {act, cleanup, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useWebApp} from '../src/hooks/useWebApp';
import {version} from '../package.json';

beforeEach(()=>{
  vi.stubEnv('PROD',true);
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
});

afterEach(()=>{
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function registrationWithWaitingWorker() {
  const worker=Object.assign(new EventTarget(),{postMessage:vi.fn()});
  const registration=Object.assign(new EventTarget(),{
    waiting:worker,installing:null,active:null,update:vi.fn(async()=>undefined),
  });
  const serviceWorker=Object.assign(new EventTarget(),{
    register:vi.fn(async()=>registration),controller:null,
  });
  vi.stubGlobal('navigator',{onLine:true,serviceWorker});
  return {worker,registration};
}

it('notifies existing users about a waiting service worker and activates only on request',async()=>{
  const {worker}=registrationWithWaitingWorker();
  const {result}=renderHook(()=>useWebApp());
  await waitFor(()=>expect(result.current.updateAvailable).toBe(true));
  expect(worker.postMessage).not.toHaveBeenCalled();

  act(()=>result.current.applyUpdate());
  expect(worker.postMessage).toHaveBeenCalledWith('activate-portfolio-update');
  expect(result.current.pending).toBe(true);
});

it('offers a subsequent worker after an earlier update was dismissed',async()=>{
  const {worker,registration}=registrationWithWaitingWorker();
  const {result}=renderHook(()=>useWebApp());
  await waitFor(()=>expect(result.current.updateAvailable).toBe(true));
  act(()=>result.current.dismissUpdate());
  expect(result.current.updateAvailable).toBe(false);

  const nextWorker=Object.assign(new EventTarget(),{postMessage:vi.fn()});
  act(()=>{
    Object.assign(registration,{installing:nextWorker,waiting:null});
    registration.dispatchEvent(new Event('updatefound'));
    Object.assign(registration,{installing:null,waiting:nextWorker});
    nextWorker.dispatchEvent(new Event('statechange'));
  });
  expect(result.current.updateAvailable).toBe(true);
  expect(worker.postMessage).not.toHaveBeenCalled();
});

it('uses version metadata when the browser cannot register service workers',async()=>{
  const register=vi.fn(async()=>{throw new Error('Service workers unavailable')});
  vi.stubGlobal('navigator',{onLine:true,serviceWorker:Object.assign(new EventTarget(),{register})});
  const fetch=vi.fn(async()=>Response.json({schemaVersion:1,version:`${version.split('.')[0]}.999.0`}));
  vi.stubGlobal('fetch',fetch);
  const {result}=renderHook(()=>useWebApp());

  await waitFor(()=>expect(result.current.updateAvailable).toBe(true));
  expect(fetch).toHaveBeenCalledWith(expect.objectContaining({pathname:'/version.json'}),expect.objectContaining({cache:'no-store'}));
  act(()=>result.current.dismissUpdate());
  expect(result.current.updateAvailable).toBe(false);
});
