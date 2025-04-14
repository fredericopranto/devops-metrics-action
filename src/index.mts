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
      console.log(`>>>> Processando repositório: ${repository}`);

      const [owner, repo] = repository.split('/');

      // Deployment Frequency
      const rel = new ReleaseAdapter(octokit, owner, repo);
      const releaseList = (await rel.GetAllReleases()) || [];
      const df = new DeployFrequency(releaseList);
      console.log(`Deployment Frequency:`, df.rate());

      // Lead Time
      
      const prs = new PullRequestsAdapter(octokit, owner, repo); 
      const commits = new CommitsAdapter(octokit);
      const pulls = (await prs.GetAllPRs()) || [];
      const lt = new LeadTime(pulls, releaseList, commits);
      const leadTime = await lt.getLeadTime(filtered);
      console.log(`Lead Time:`, leadTime);
      

      // Change Failure Rate
      // Mean Time to Restore
      const issueAdapter = new IssuesAdapter(octokit, owner, repo); 
      const issueList = (await issueAdapter.GetAllIssues()) || [];
      if (issueList.length > 0) {
        const cfr = new ChangeFailureRate(issueList, releaseList);
        console.log(`Change Failure Rate:`, cfr.Cfr());
        const mttr = new MeanTimeToRestore(issueList, releaseList);
        console.log(`Mean Time to Restore:`, mttr.mttr());
      } else {
        console.log(`Change Failure Rate: empty issue list`);
        console.log(`Mean Time to Restore: empty issue list`);
      }
    }
  } catch (error: any) {
    console.error('Erro ao executar o projeto:', error.message);
  }
}

run();