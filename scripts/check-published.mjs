import assert from 'node:assert/strict';
const repo='yuchen0x1/yuchen0x1.github.io';
const read=async(url,headers={})=>{
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(20000),redirect:'error'});
  assert.ok(response.ok,`${url}: ${response.status}`);
  return response;
};
for(const host of ['https://lenmo.top','https://yuchen0x1.github.io']) {
  const remote=await (await read(host+'/version.json')).json();
  assert.equal(remote.schemaVersion,1);
  assert.match(remote.version,/^\d+\.\d+\.\d+$/);
  await read(host+'/manifest.webmanifest');
  await read(host+'/sw.js');
  const snapshot=await (await read(host+'/data/repos.json')).json();
  assert.equal(snapshot.schemaVersion,1);
  assert.ok(snapshot.repos.length>0);
  assert.ok(Date.now()-Date.parse(snapshot.generatedAt)<7*86400000,'Snapshot is over seven days old');
  console.log('PASS',host,'version',remote.version,'snapshot',snapshot.generatedAt);
}
const headers=process.env.GH_TOKEN?{Authorization:'Bearer '+process.env.GH_TOKEN}:{};
const release=await (await read(`https://api.github.com/repos/${repo}/releases/latest`,headers)).json();
for(const suffix of ['web.zip','SHA256SUMS.txt','release-metadata.json']) {
  const asset=release.assets.find((item)=>item.name.endsWith(suffix));
  assert.ok(asset?.size>0,`Missing release asset ${suffix}`);
}
console.log('PASS',release.tag_name,'release asset inventory');
