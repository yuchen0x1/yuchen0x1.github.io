import {appendFile, readFile} from 'node:fs/promises';

const reportPath = process.argv[2];
if (!reportPath) throw new Error('Pass the npm audit JSON report path.');

const report = JSON.parse((await readFile(reportPath, 'utf8')).replace(/^\uFEFF/, ''));
const counts = report.metadata?.vulnerabilities;
if (!counts || !report.vulnerabilities) {
  throw new Error('The npm audit report is incomplete or contains a registry error.');
}

const highPackages = Object.values(report.vulnerabilities)
  .filter(({severity}) => severity === 'high' || severity === 'critical')
  .map(({name}) => name)
  .sort();
const summary = [
  '## Complete lockfile dependency audit',
  `- Critical findings: ${counts.critical}`,
  `- High findings: ${counts.high}`,
  `- Moderate findings: ${counts.moderate}`,
  `- Low findings: ${counts.low}`,
  highPackages.length ? `- High or critical dependency nodes: ${highPackages.join(', ')}` : '- No high or critical dependency nodes.',
  '- Production dependencies are enforced by a separate blocking audit step.',
].join('\n') + '\n';

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
}
process.stdout.write(summary);
