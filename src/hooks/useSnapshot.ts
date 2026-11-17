import {useCallback, useEffect, useRef, useState} from 'react';
import {loadSnapshot, type LoadedSnapshot} from '../services/snapshot';
const initial:LoadedSnapshot={snapshot:null,history:null,cached:false,cachedAt:null,checkedAt:'',error:null};
export function useSnapshot() {
  const [state,setState]=useState<LoadedSnapshot>(initial);
  const [loading,setLoading]=useState(true);
  const mounted=useRef(true);
  const refresh=useCallback(async()=>{setLoading(true);const controller=new AbortController();const timer=window.setTimeout(()=>controller.abort(),10000);try{const next=await loadSnapshot(controller.signal);if(mounted.current)setState(next);}finally{window.clearTimeout(timer);if(mounted.current)setLoading(false);}},[]);
  useEffect(()=>{mounted.current=true;void refresh();return()=>{mounted.current=false};},[refresh]);
  useEffect(()=>{const handler=()=>{if(document.visibilityState==='visible')void refresh()};const interval=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh()},60000);document.addEventListener('visibilitychange',handler);return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',handler)}},[refresh]);
  return {...state,loading,refresh};
}
