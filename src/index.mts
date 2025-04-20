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
import fs from 'fs';
import path from 'path';

dotenv.config();

export async function run(): Promise<void> {
  try {
    const repositoriesEnv = process.env.GITHUB_REPOSITORY || '';
    const token = process.env.GITHUB_TOKEN || '';
    const logging = process.env.LOGGING === 'false';
    const filtered = process.env.FILTERED === 'true';
    const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : undefined;
    const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : undefined;

    if (!repositoriesEnv || !token) {
      throw new Error('Please configure the GITHUB_REPOSITORY and GITHUB_TOKEN variables in the .env file');
    }

    const repositories = repositoriesEnv
      .split(/[[\]\n,]+/)
      .map(s => s.trim())
      .filter(x => x !== '');

    console.log(`${repositories.length} repository(ies) registered.`);
    console.log(`Start Date: ${startDate ? startDate.toISOString() : 'Not defined'}`);
    console.log(`End Date: ${endDate ? endDate.toISOString() : 'Not defined'}`);

    // Create a single Octokit instance with fetch
    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    const results: { repository: string; df: number }[] = [];

    for (const repository of repositories) {
      console.log(`>>>> Processing repository: ${repository}`);

      const [owner, repo] = repository.split('/');

      // Deployment Frequency
      const rel = new ReleaseAdapter(octokit, owner, repo);
      const releaseList = (await rel.GetAllReleases(startDate, endDate)) || [];
      const df = new DeployFrequency(releaseList,startDate, endDate);
      const rate = df.rate();
      console.log(`Deployment Frequency (days):`, rate);

      // Lead Time
      const prs = new PullRequestsAdapter(octokit, owner, repo); 
      const commits = new CommitsAdapter(octokit);
      //const pulls = (await prs.GetAllPRs()) || [];
      //const lt = new LeadTime(pulls, releaseList, commits);
      //const leadTime = await lt.getLeadTime(filtered);
      //console.log(`Lead Time:`, leadTime);

      // Change Failure Rate
      // Mean Time to Restore
      const issueAdapter = new IssuesAdapter(octokit, owner, repo); 
      //const issueList = (await issueAdapter.GetAllIssues()) || [];
      // if (issueList.length > 0) {
      //   const cfr = new ChangeFailureRate(issueList, releaseList);
      //   console.log(`Change Failure Rate:`, cfr.Cfr());
      //   const mttr = new MeanTimeToRestore(issueList, releaseList);
      //   console.log(`Mean Time to Restore:`, mttr.mttr());
      // } else {
      //   console.log(`Change Failure Rate: empty issue list`);
      //   console.log(`Mean Time to Restore: empty issue list`);
      // }
      
      results.push({ repository, df: rate });
    }
    
    // Generate the CSV
    const csvContent = 'Repository,Deployment Frequency (DF)\n' + results.map(r => `${r.repository},${r.df}`).join('\n');
    const outputPath = path.join(process.cwd(), 'df_metrics.csv');
    fs.writeFileSync(outputPath, csvContent);

    console.log(`CSV generated at: ${outputPath}`);
  } catch (error: any) {
    console.error('Error running the project:', error.message);
  }
}

run();