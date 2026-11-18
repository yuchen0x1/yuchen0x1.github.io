import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [tag,commit]=process.argv.slice(2);
const {version}=JSON.parse(await readFile('package.json','utf8'));
assert.equal(tag,'v'+version,'Tag must match package.json');
assert.match(commit,/^[a-f0-9]{40}$/);
const notes=await readFile('docs/releases/release-notes.md','utf8');
const block=notes.split('## '+tag+' · ')[1]?.split(/\n## /)[0];
assert.ok(block,'Release notes must include this version');
await writeFile('release/notes.md',block.substring(block.indexOf('\n')).trim()+'\n');
const archive=`yuchen0x1-lab-${tag}-web.zip`;
const buffer=await readFile('release/'+archive);
const sha256=createHash('sha256').update(buffer).digest('hex');
const metadata={
  schemaVersion:1,version,commit,platform:'web',architecture:'any',
  minimumRuntime:'Modern browser with ES2022, HTTPS for PWA',
  file:archive,bytes:buffer.length,sha256,
  download:`https://github.com/yuchen0x1/yuchen0x1.github.io/releases/download/${tag}/${archive}`,
  release:`https://github.com/yuchen0x1/yuchen0x1.github.io/releases/tag/${tag}`,
  authentication:'GitHub artifact attestation',
};
await writeFile('release/release-metadata.json',JSON.stringify(metadata,null,2)+'\n');
const lines=[];
for(const file of [archive,'release-metadata.json']) {
  const content=await readFile('release/'+file);
  lines.push(createHash('sha256').update(content).digest('hex')+'  '+file);
}
await writeFile('release/SHA256SUMS.txt',lines.join('\n')+'\n');
