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
    const repositoriesEnv = process.env.GITHUB_REPOSITORY || '';
    const token = process.env.GITHUB_TOKEN || '';
    const logging = process.env.LOGGING === 'false';
    const filtered = process.env.FILTERED === 'true';

    if (!repositoriesEnv || !token) {
      throw new Error('Por favor, configure as variáveis GITHUB_REPOSITORY e GITHUB_TOKEN no arquivo .env');
    }

    const repositories = repositoriesEnv
      .split(/[[\]\n,]+/)
      .map(s => s.trim())
      .filter(x => x !== '');

    console.log(`${repositories.length} repositório(s) registrado(s).`);

    // Criar uma única instância do Octokit com fetch
    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    for (const repository of repositories) {
      console.log(`Processando repositório: ${repository}`);

      const [owner, repo] = repository.split('/');

      const rel = new ReleaseAdapter(octokit, owner, repo);
      const releaseList = (await rel.GetAllReleases()) || [];
      const df = new DeployFrequency(releaseList);
      console.log(`Deployment Frequency (${repository}):`, df.rate());
      if (logging) {
        //console.log('Deployment Frequency Log:', df.getLog().join('\n'));
      }

      // Pull Requests e Commits (mantém a lógica atual com lista)
      const prs = new PullRequestsAdapter(octokit, owner, repositories);
      const commits = new CommitsAdapter(octokit);
      const pulls = (await prs.GetAllPRs()) || [];
      const lt = new LeadTime(pulls, releaseList, commits);
      const leadTime = await lt.getLeadTime(filtered);
      console.log(`Lead Time (${repository}):`, leadTime);
      if (logging) {
        //console.log('Lead Time Log:', lt.getLog().join('\n'));
      }

      // Issues (mantém a lógica atual com lista)
      const issueAdapter = new IssuesAdapter(octokit, owner, repositories);
      const issueList = (await issueAdapter.GetAllIssues()) || [];
      if (issueList.length > 0) {
        const cfr = new ChangeFailureRate(issueList, releaseList);
        console.log(`Change Failure Rate (${repository}):`, cfr.Cfr());
        const mttr = new MeanTimeToRestore(issueList, releaseList);
        console.log(`Mean Time to Restore (${repository}):`, mttr.mttr());
      } else {
        console.log(`Change Failure Rate (${repository}): empty issue list`);
        console.log(`Mean Time to Restore (${repository}): empty issue list`);
      }
    }
  } catch (error: any) {
    console.error('Erro ao executar o projeto:', error.message);
  }
}

run();