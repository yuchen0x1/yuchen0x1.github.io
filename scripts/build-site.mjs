import {createHash} from 'node:crypto';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {basename, resolve} from 'node:path';

const dist = resolve('dist');
const icons = ['pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png'];
const iconEntries = icons.slice(0,2).map((src,i)=>({src, sizes:i===0?'192x192':'512x512', type:'image/png', purpose:'any'}));
const {version} = JSON.parse(await readFile('package.json','utf8'));
const lock = JSON.parse(await readFile('package-lock.json','utf8'));
const manifest = {
  id: './',
  name:'yuchen0x1 · 独立开发者实验室',
  short_name:'yuchen0x1 Lab',
  start_url:'./',
  scope:'./',
  display:'standalone',
  background_color:'#070b12',
  theme_color:'#070b12',
  icons:iconEntries,
};
await writeFile(resolve(dist,'manifest.webmanifest'), JSON.stringify(manifest,null,2)+'\n');

const assetNames = await readdir(resolve(dist,'assets'));
const shell = [
  'index.html', 'favicon.svg', 'manifest.webmanifest', ...icons,
  ...assetNames.filter((file)=>/\.(js|css)$/.test(file)).sort().map((file)=>'assets/'+file),
];
const integrity = await Promise.all(shell.map(async (path)=>({
  path,
  integrity:'sha256-'+createHash('sha256').update(await readFile(resolve(dist,path))).digest('base64'),
})));
const template = await readFile(new URL('./service-worker.js', import.meta.url),'utf8');
const build = createHash('sha256').update(version).update(template).update(JSON.stringify(integrity)).digest('hex');
await writeFile(resolve(dist,'sw.js'), `const BUILD = ${JSON.stringify(build)};\nconst SHELL = ${JSON.stringify(integrity)};\n${template}`);
await writeFile(resolve(dist,'version.json'), JSON.stringify({schemaVersion:1,version,build},null,2)+'\n');

const notices = ['Third-party license notices','This report includes production dependencies declared in package-lock.json.'];
for (const [path,pkg] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/') || pkg.dev) continue;
  const files = (await readdir(path).catch((error)=>{
    if (error.code==='ENOENT' && pkg.optional) return [];
    throw error;
  })).filter((file)=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(file)).sort();
  if (!files.length) continue;
  const name = path.slice(path.lastIndexOf('node_modules/')+'node_modules/'.length) || basename(path);
  notices.push(`--- ${name}@${pkg.version} (${pkg.license||'see text'}) ---`);
  for (const file of files) notices.push(await readFile(resolve(path,file),'utf8'));
}
await writeFile(resolve(dist,'THIRD-PARTY-NOTICES.txt'),notices.join('\n\n')+'\n');
