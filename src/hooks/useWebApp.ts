import {useEffect,useState} from 'react';
import {version} from '../../package.json';

interface InstallEvent extends Event {
  prompt():Promise<unknown>;
}

export function useWebApp() {
  const [waiting,setWaiting]=useState<ServiceWorker|null>(null);
  const [availableVersion,setAvailableVersion]=useState<string|null>(null);
  const [dismissed,setDismissed]=useState<ServiceWorker|string|null>(null);
  const [pending,setPending]=useState(false);
  const [applyError,setApplyError]=useState(false);
  const [offline,setOffline]=useState(()=>!navigator.onLine);
  const [installer,setInstaller]=useState<InstallEvent|null>(null);
  const [activation,setActivation]=useState<ServiceWorker|null>(null);

  useEffect(()=>{
    const updateConnection=()=>setOffline(!navigator.onLine);
    const saveInstaller=(event:Event)=>{
      event.preventDefault();
      setInstaller(event as InstallEvent);
    };
    const clearInstaller=()=>setInstaller(null);
    window.addEventListener('online',updateConnection);
    window.addEventListener('offline',updateConnection);
    window.addEventListener('beforeinstallprompt',saveInstaller);
    window.addEventListener('appinstalled',clearInstaller);
    return ()=>{
      window.removeEventListener('online',updateConnection);
      window.removeEventListener('offline',updateConnection);
      window.removeEventListener('beforeinstallprompt',saveInstaller);
      window.removeEventListener('appinstalled',clearInstaller);
    };
  },[]);

  useEffect(()=>{
    if (!import.meta.env.PROD) return;
    const base=new URL(import.meta.env.BASE_URL,location.href);
    const controller=new AbortController();
    const workers=new Set<ServiceWorker>();
    let registration:ServiceWorkerRegistration|undefined;
    let checkedAt=0;
    const syncWaiting=()=>setWaiting(registration?.waiting??null);
    const watchInstall=()=>{
      const worker=registration?.installing;
      if (!worker||workers.has(worker)) return;
      workers.add(worker);
      worker.addEventListener('statechange',syncWaiting);
    };
    const check=async()=>{
      if (document.visibilityState!=='visible'||!navigator.onLine||Date.now()-checkedAt<60_000) return;
      checkedAt=Date.now();
      try {
        if (registration) {
          await registration.update();
          syncWaiting();
          return;
        }
        const response=await fetch(new URL('version.json',base),{cache:'no-store',signal:controller.signal});
        if (!response.ok) return;
        const remote:unknown=await response.json();
        if (!controller.signal.aborted && remote && typeof remote==='object' &&
            'schemaVersion' in remote && remote.schemaVersion===1 &&
            'version' in remote && typeof remote.version==='string' && /^\d+\.\d+\.\d+$/.test(remote.version)) {
          setAvailableVersion(remote.version!==version?remote.version:null);
        }
      } catch { /* The current application remains available. */ }
    };
    const start=async()=>{
      if ('serviceWorker' in navigator) {
        try {
          const next=await navigator.serviceWorker.register(new URL('sw.js',base),{updateViaCache:'none'});
          if (controller.signal.aborted) return;
          registration=next;
          registration.addEventListener('updatefound',watchInstall);
          watchInstall();
          syncWaiting();
        } catch { /* Web-only hosts use the release metadata check. */ }
      }
      void check();
    };

    void start();
    const timer=window.setInterval(()=>void check(),120_000);
    const onVisible=()=>void check();
    const onController=()=>{
      if (registration?.active && navigator.serviceWorker.controller===registration.active) {
        setWaiting(null);
      }
    };
    document.addEventListener('visibilitychange',onVisible);
    window.addEventListener('online',onVisible);
    navigator.serviceWorker?.addEventListener('controllerchange',onController);
    return ()=>{
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisible);
      window.removeEventListener('online',onVisible);
      navigator.serviceWorker?.removeEventListener('controllerchange',onController);
      registration?.removeEventListener('updatefound',watchInstall);
      workers.forEach((worker)=>worker.removeEventListener('statechange',syncWaiting));
    };
  },[]);

  useEffect(()=>{
    if (!activation) return;
    const reload=()=>{
      if (navigator.serviceWorker.controller===activation) location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange',reload);
    const timer=window.setTimeout(()=>{
      setActivation(null);
      setPending(false);
      setApplyError(true);
    },8_000);
    activation.postMessage('activate-portfolio-update');
    reload();
    return ()=>{
      navigator.serviceWorker.removeEventListener('controllerchange',reload);
      window.clearTimeout(timer);
    };
  },[activation]);

  const update = waiting??availableVersion;
  return {
    version,offline,pending,applyError,
    install:installer?async()=>{
      setInstaller(null);
      try { await installer.prompt(); } catch { /* Browser menu can still install. */ }
    }:null,
    updateAvailable:update!==null && update!==dismissed,
    dismissUpdate:()=>setDismissed(update),
    applyUpdate:()=>{
      setApplyError(false);
      if (!waiting) { location.reload(); return; }
      setPending(true);
      setActivation(waiting);
    },
  };
}
