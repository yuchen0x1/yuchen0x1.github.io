import {useCallback, useEffect, useRef, useState} from 'react';
import {loadSnapshot, type LoadedSnapshot} from '../services/snapshot';
const initial:LoadedSnapshot={snapshot:null,history:null,cached:false,cachedAt:null,checkedAt:'',error:null};
export function useSnapshot() {
  const [state,setState]=useState<LoadedSnapshot>(initial);
  const [loading,setLoading]=useState(true);
  const pending=useRef<AbortController|null>(null);
  const refresh=useCallback(async()=>{
    if (pending.current) return;
    const controller=new AbortController();
    pending.current=controller;
    setLoading(true);
    const timer=window.setTimeout(()=>controller.abort(),10000);
    try {
      const next=await loadSnapshot(controller.signal);
      if (pending.current===controller) {
        setState((previous)=>!next.snapshot && previous.snapshot
          ? {...previous,cached:true,checkedAt:next.checkedAt,error:next.error}
          : next);
      }
    } finally {
      window.clearTimeout(timer);
      if (pending.current===controller) {
        pending.current=null;
        setLoading(false);
      }
    }
  },[]);
  useEffect(()=>{
    void refresh();
    return ()=>{
      pending.current?.abort();
      pending.current=null;
    };
  },[refresh]);
  useEffect(()=>{const handler=()=>{if(document.visibilityState==='visible')void refresh()};const interval=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh()},60000);document.addEventListener('visibilitychange',handler);return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',handler)}},[refresh]);
  return {...state,loading,refresh};
}
