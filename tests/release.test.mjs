import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

test('release packaging retains template sections and excludes older versions', async()=>{
  const root=await mkdtemp(join(tmpdir(),'portfolio-release-'));
  try {
    await mkdir(join(root,'docs/releases'),{recursive:true});
    await mkdir(join(root,'release'));
    await writeFile(join(root,'package.json'),JSON.stringify({version:'1.1.1'}));
    const expected='## Overview\n\nThis version.\n\n## Fixes\n\n- Fixed the cache.\n';
    await writeFile(join(root,'docs/releases/release-notes.md'),
      '# Releases\n\n## v1.1.1 · 2026-11-26\n\n'+expected+'\n## v1.1.0 · 2026-11-18\n\nOld version.\n');
    await writeFile(join(root,'release/yuchen0x1-lab-v1.1.1-web.zip'),'archive fixture');
    const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/package-release.mjs',import.meta.url)),
      'v1.1.1','a'.repeat(40)],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.equal(await readFile(join(root,'release/notes.md'),'utf8'),expected);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
