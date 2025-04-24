import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import { ReleaseAdapter } from './ReleaseAdapter.js';
import { DeployFrequency } from './DeployFrequency.js';
import { DORAMetricsEvaluator } from './DORAMetricsEvaluator.js';
import fs from 'fs';
import path from 'path';
import { PullRequestsAdapter } from './PullRequestsAdapter.js';
import { LeadTime } from './LeadTime.js';
import { CommitsAdapter } from './CommitsAdapter.js';

dotenv.config();

export async function run(): Promise<void> {
  try {
    const filtered = process.env.FILTERED === 'false';
    const token = process.env.GITHUB_TOKEN || '';
    const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : undefined;
    const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : undefined;

    if (!token) {
      throw new Error('Please configure the GITHUB_TOKEN variable in the .env file');
    }

    const projectsFilePath = path.join(process.cwd(), 'projects.csv');
    if (!fs.existsSync(projectsFilePath)) {
      throw new Error(`File projects.csv not found at ${projectsFilePath}`);
    }

    const projectsData = fs.readFileSync(projectsFilePath, 'utf-8');
    const repositories = projectsData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => {
        const [repository, category] = line.split(',');
        return { repository: repository.trim(), category: category.trim() };
      });

    console.log(`${repositories.length} repository(ies) loaded from projects.csv.`);
    console.log(`Start Date: ${startDate ? startDate.toISOString() : 'Not defined'}`);
    console.log(`End Date: ${endDate ? endDate.toISOString() : 'Not defined'}`);

    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    const results: { repository: string; category: string; df: string | null; classification: string; leadTime: string | null }[] = [];
    const nullResults: { repository: string; category: string; metric: string }[] = [];

    for (const { repository, category } of repositories) {
      console.log(`>>>> Processing repository: ${repository} (Category: ${category})`);

      const [owner, repo] = repository.split('/');
      const rel = new ReleaseAdapter(octokit, owner, repo);
      const releaseList = (await rel.GetAllReleases(startDate, endDate)) || [];

      // Deployment Frequency
      const df = new DeployFrequency(releaseList, startDate, endDate);
      const rate = df.rate();
      if (rate === null) { nullResults.push({ repository, category, metric: 'df' }); continue; }
      const deploysPerMonth = rate ? (30 / rate).toFixed(0) : 'null';
      const dfClassification = DORAMetricsEvaluator.evaluateDeploymentFrequency(rate);
      console.log(`Deployment Frequency (days):`, rate);
      console.log(`Deployment Frequency (deploy/month):`, deploysPerMonth);
      console.log(`Deployment Frequency (level): ${dfClassification}`);

      // Lead Time
      const prs = new PullRequestsAdapter(octokit, owner, repo);
      const commits = new CommitsAdapter(octokit);
      //const pulls2 = (await prs.getPullRequestsGraphQL(startDate, endDate)) || [];
      const pulls = (await prs.GetAllPRs()) || [];
      const lt = new LeadTime(pulls, releaseList, commits);
      const leadTime = await lt.getLeadTime(filtered);
      if (leadTime === null ) { nullResults.push({ repository, category, metric: 'Lead Time' }); continue; }
      console.log(`Lead Time (days):`, leadTime);

      results.push({
        repository,
        category,
        df: deploysPerMonth,
        classification: dfClassification,
        leadTime: leadTime.toFixed(2),
      });
    }

    // Generate the main CSV (metrics.csv)
    const csvContent =
      'Repository,Category,Deployment Frequency (DF),DF Level,Lead Time (days)\n' +
      results.map(r => `${r.repository},${r.category},${r.df},${r.classification},${r.leadTime}`).join('\n');
    const outputPath = path.join(process.cwd(), 'metrics.csv');
    fs.writeFileSync(outputPath, csvContent);
    console.log(`CSV generated at: ${outputPath}`);

    // Generate the null metrics CSV (null_metrics.csv)
    const nullCsvContent =
      'Repository,Category,Metric\n' +
      nullResults.map(r => `${r.repository},${r.category},${r.metric}`).join('\n');
    const nullOutputPath = path.join(process.cwd(), 'null_metrics.csv');
    fs.writeFileSync(nullOutputPath, nullCsvContent);
    console.log(`Null metrics CSV generated at: ${nullOutputPath}`);
  } catch (error: any) {
    console.error('Error running the project:', error.message);
  }
}

run();