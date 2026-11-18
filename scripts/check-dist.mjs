import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve('dist');
const html=await readFile(resolve(root,'index.html'),'utf8');
const manifest=JSON.parse(await readFile(resolve(root,'manifest.webmanifest'),'utf8'));
const metadata=JSON.parse(await readFile(resolve(root,'version.json'),'utf8'));
const {version}=JSON.parse(await readFile('package.json','utf8'));
assert.equal(metadata.version,version);
assert.match(metadata.build,/^[a-f0-9]{64}$/);
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.display,'standalone');
assert.match(html,/rel="manifest"/);
for(const icon of manifest.icons) {
  const png=await readFile(resolve(root,icon.src));
  const [width,height]=icon.sizes.split('x').map(Number);
  assert.equal(png.readUInt32BE(16),width);
  assert.equal(png.readUInt32BE(20),height);
}
const files=await readdir(root,{recursive:true});
assert.equal(files.filter((file)=>/\.map$|(^|[/\\])\.env/.test(file)).length,0);
for(const file of ['sw.js','version.json','THIRD-PARTY-NOTICES.txt','data/repos.json','data/history.json']) {
  assert.ok((await readFile(resolve(root,file))).length>0,file);
}
const sw=await readFile(resolve(root,'sw.js'),'utf8');
assert.match(sw,/integrity/);
assert.match(sw,/activate-portfolio-update/);
console.log('PASS distribution metadata, icons, offline shell, notices and exposed files');
