import {useWebApp} from '../hooks/useWebApp';
import type {Language} from '../types/github';

export function WebAppStatus({lang}:{lang:Language}) {
  const web=useWebApp();
  const zh=lang==='zh';
  return <>
    <div className="web-app-tools">
      <span>v{web.version}{web.offline && (zh?' · 离线':' · Offline')}</span>
      {web.install && <button type="button" onClick={()=>void web.install?.()}>{zh?'安装作品集':'Install portfolio'}</button>}
    </div>
    {web.updateAvailable && <aside className="web-update" aria-label={zh?'应用更新':'App update'}>
      <span role="status">{zh?'当前版本':'Current version'} v{web.version} · {web.applyError
        ? (zh?'更新尚未就绪，请重试。':'The update is not ready. Try again.')
        : (zh?'新版作品集已就绪。':'A portfolio update is available.')}</span>
      <a href="https://github.com/yuchen0x1/yuchen0x1.github.io/releases/latest" target="_blank" rel="noreferrer">{zh?'版本说明':'Release notes'}</a>
      <button className="button primary" type="button" disabled={web.pending} onClick={web.applyUpdate}>{web.pending ? (zh?'更新中…':'Updating…') : (zh?'更新并刷新':'Update and reload')}</button>
      <button className="button ghost" type="button" disabled={web.pending} onClick={web.dismissUpdate}>{zh?'稍后':'Later'}</button>
    </aside>}
  </>;
}
