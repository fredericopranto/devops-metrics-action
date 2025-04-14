// filepath: c:\work\DOUTORADO\devops-metrics-action\src\index2.ts
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import { ReleaseAdapter } from './ReleaseAdapter.js';
import { DeployFrequency } from './DeployFrequency.js';
import { ChangeFailureRate } from './ChangeFailureRate.js';
import { IssuesAdapter } from './IssuesAdapter.js';
import { MeanTimeToRestore } from './MeanTimeToRestore.js';
import { PullRequestsAdapter } from './PullRequestsAdapter.js';
import { CommitsAdapter } from './CommitsAdapter.js';
import { LeadTime } from './LeadTime.js';

dotenv.config();

export async function run(): Promise<void> {
  try {
    const repo = process.env.REPO || '';
    const owner = process.env.OWNER || '';
    const token = process.env.GITHUB_TOKEN || '';
    const logging = process.env.LOGGING === 'false';
    const filtered = process.env.FILTERED === 'true';

    if (!repo || !owner || !token) {
      throw new Error('Por favor, configure as variáveis REPO, OWNER e GITHUB_TOKEN no arquivo .env');
    }

    const repositories = repo
      .split(/[[\]\n,]+/)
      .map(s => s.trim())
      .filter(x => x !== '');

    console.log(`${repositories.length} repositório(s) registrado(s).`);

    // Criar uma única instância do Octokit com fetch
    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    // Passar a instância do Octokit para o ReleaseAdapter
    const rel = new ReleaseAdapter(octokit, owner, repositories);
    const releaseList = (await rel.GetAllReleases()) || [];
    const df = new DeployFrequency(releaseList);
    console.log('Deployment Frequency:', df.rate());
    if (logging) {
      //console.log('Deployment Frequency Log:', df.getLog().join('\n'));
    }

    const prs = new PullRequestsAdapter(octokit, owner, repositories);
    const commits = new CommitsAdapter(octokit);
    const pulls = (await prs.GetAllPRsLastMonth()) || [];
    const lt = new LeadTime(pulls, releaseList, commits);
    const leadTime = await lt.getLeadTime(filtered);
    console.log('Lead Time:', leadTime);
    if (logging) {
      console.log('Lead Time Log:', lt.getLog().join('\n'));
    }

    const issueAdapter = new IssuesAdapter(octokit, owner, repositories);
    const issueList = (await issueAdapter.GetAllIssuesLastMonth()) || [];
    if (issueList.length > 0) {
      const cfr = new ChangeFailureRate(issueList, releaseList);
      console.log('Change Failure Rate:', cfr.Cfr());
      const mttr = new MeanTimeToRestore(issueList, releaseList);
      console.log('Mean Time to Restore:', mttr.mttr());
    } else {
      console.log('Change Failure Rate: empty issue list');
      console.log('Mean Time to Restore: empty issue list');
    }
  } catch (error: any) {
    console.error('Erro ao executar o projeto:', error.message);
  }
}

run();