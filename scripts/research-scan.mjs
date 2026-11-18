import {readFile,writeFile,mkdir} from 'node:fs/promises';
const projects=JSON.parse(await readFile('docs/research/projects.json','utf8'));
const observedAt=new Date().toISOString();
const report=[];
for(const project of projects) {
  const response=await fetch('https://api.github.com/repos/'+project.repository,{
    headers:{Accept:'application/vnd.github+json',...(process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})},
    signal:AbortSignal.timeout(20000),
  });
  if(!response.ok) throw new Error(`${project.repository}: HTTP ${response.status}`);
  const latest=await response.json();
  report.push({repository:latest.full_name,pushedAt:latest.pushed_at,archived:latest.archived,stars:latest.stargazers_count});
}
await mkdir('research-scan',{recursive:true});
await writeFile('research-scan/repositories.json',JSON.stringify({observedAt,report},null,2)+'\n');
console.log('Observed',report.length,'repositories. Review changes before implementation.');
