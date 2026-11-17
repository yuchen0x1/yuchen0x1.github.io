export function recordHistory(history, snapshot) {
  const current = history?.schemaVersion === 1 && Array.isArray(history.samples) ? history : {schemaVersion:1, samples:[]};
  const generatedAt = new Date(snapshot.generatedAt);
  if (Number.isNaN(generatedAt.valueOf())) throw new Error('snapshot generatedAt must be a valid date');
  const bucket = new Date(Math.floor(generatedAt.valueOf() / (30 * 60 * 1000)) * (30 * 60 * 1000)).toISOString();
  const sample = {
    date: bucket,
    stars: snapshot.repos.reduce((sum, repo) => sum + Number(repo.stars || 0), 0),
    forks: snapshot.repos.reduce((sum, repo) => sum + Number(repo.forks || 0), 0),
    repos: Object.fromEntries(snapshot.repos.map((repo) => [repo.name, Number(repo.stars || 0)])),
  };
  const samples = [...current.samples];
  const index = samples.findIndex((item) => item.date === bucket);
  if (index >= 0) samples[index] = sample;
  else samples.push(sample);
  samples.sort((a,b) => a.date.localeCompare(b.date));
  return {schemaVersion:1, samples};
}
