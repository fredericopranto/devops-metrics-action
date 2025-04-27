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
import { IssuesAdapter } from './IssuesAdapter.js';
import { ChangeFailureRate } from './ChangeFailureRate.js';
import { MeanTimeToRestore } from './MeanTimeToRestore.js';
import { Commit } from './types/Commit.js';

dotenv.config();

export async function run(): Promise<void> {
  try {
    const token = process.env.GITHUB_TOKEN || '';
    const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : null;
    const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : null;

    if (!token) {
      throw new Error('Please configure the GITHUB_TOKEN variable in the .env file');
    }

    const projectsFilePath = path.join(process.cwd(), 'projects.csv');
    if (!fs.existsSync(projectsFilePath)) {
      throw new Error('File projects.csv not found at ${projectsFilePath}');
    }

    const projectsData = fs.readFileSync(projectsFilePath, 'utf-8');
    const repositories = projectsData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => {
        const [repository, category] = line.split(',');
        if (!repository || !category) {
          throw new Error(`Invalid entry in projects.csv: "${line}". Both repository and category must be defined.`);
        }
        return { repository: repository.trim(), category: category.trim() };
      });

    console.log(repositories.length, 'repository(ies) loaded from projects.csv.');
    console.log('Start Date: ' + (startDate ? startDate.toISOString() : 'Not defined'));
    console.log('End Date: ' + (endDate ? endDate.toISOString() : 'Not defined'));

    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    const results: { repository: string; category: string; 
        dfValue: string | null; dfLevel: string; 
        ltValue: string | null; ltLevel: string;
        cfrValue: number | null; cfrLevel: string; 
        mttrValue: number | null; mttrLevel: string }[] = [];
    const nullResults: { repository: string; category: string; metric: string }[] = [];

    for (const { repository, category } of repositories) {
      console.log('>>>> Processing repository: ' + repository + ' (Category: ' + category + ')');

      const [owner, repo] = repository.split('/');
      const adapterRelease = new ReleaseAdapter(octokit, owner, repo);
      const adapterIssue = new IssuesAdapter(octokit, owner, repo);
      const adapterPR = new PullRequestsAdapter(octokit, owner, repo);
      const adapterCommits = new CommitsAdapter(octokit);

      const releases = (await adapterRelease.GetAllReleases(startDate, endDate)) || [];
      const issues = (await adapterIssue.GetAllIssues()) || [];
      let pulls = (await adapterPR.GetAllPRs()) || [];
      pulls = await Promise.all(
        pulls.map(async pull => {
          const pullCommits = await adapterCommits.getCommitsFromUrl(pull.commits_url);
          pull.commits = pullCommits as Commit[];
          return pull;
        })
      );
      
      console.log('Total issues: ', issues.length);
      console.log('Total releases: ', releases.length);
      console.log('Total pulls: ', pulls.length);
      console.log('Total commits: ', pulls.reduce((sum, pull) => sum + (pull.commits?.length || 0), 0));

      // Deployment Frequency
      const df = new DeployFrequency(releases, startDate, endDate);
      const dfDays = df.rate();
      if (dfDays === null) { nullResults.push({ repository, category, metric: 'df' }); continue; }
      const dfValue = dfDays ? (30 / dfDays).toFixed(2) : 'null';
      const dfLevel = DORAMetricsEvaluator.evaluateDeploymentFrequency(dfDays);
      console.log('Deployment Frequency (days):', dfDays);
      console.log('Deployment Frequency (deploy/month):', dfValue);
      console.log('Deployment Frequency (level):', dfLevel);

      // Lead Time
      const lt = new LeadTime(pulls, releases, adapterCommits);
      const ltValue = await lt.getLeadTime();
      if (ltValue === null ) { nullResults.push({ repository, category, metric: 'Lead Time' }); continue; }
      const ltLevel = DORAMetricsEvaluator.evaluateLeadTime(ltValue);
      console.log('Lead Time (days):', ltValue);
      console.log('Lead Time (level):', ltLevel);

      // Change Failure Rate
      const cfr = new ChangeFailureRate(issues, releases);
      const cfrValue = cfr.Cfr()
      const cfrLevel = DORAMetricsEvaluator.evaluateChangeFailureRate(cfrValue);
      console.log('Change Failure Rate:', cfrValue);
      console.log('Change Failure Rate (level):', cfrLevel);

      // Mean Time to Restore
      const mttr = new MeanTimeToRestore(issues, releases);
      const mttrValue = mttr.mttr();
      const mttrLevel = DORAMetricsEvaluator.evaluateMTTR(mttrValue);
      console.log('Mean Time to Restore:', mttrValue);
      console.log('Mean Time to Restore (level):', mttrLevel);

      results.push({
        repository, category,
        dfValue, dfLevel,
        ltValue: ltValue.toFixed(2), ltLevel,
        cfrValue, cfrLevel,
        mttrValue, mttrLevel,
      });
    }

    const csvContent =
      'Repository,Category,Deployment Frequency (DF),DF Level,Lead Time (days),LT Level,Change Failure Rate (CFR),CFR Level,Mean Time to Restore (MTTR),MTTR Level\n' +
      results.map(r =>
        '${r.repository},${r.category},${r.dfValue},${r.dfLevel},${r.ltValue},${r.ltLevel},${r.cfrValue},${r.cfrLevel},${r.mttrValue},${r.mttrLevel}'
      ).join('\n');

    const outputPath = path.join(process.cwd(), 'metrics.csv');
    fs.writeFileSync(outputPath, csvContent);
    console.log('CSV generated at:' + outputPath);

    const nullCsvContent =
      'Repository,Category,Metric\n' +
      nullResults.map(r => '${r.repository},${r.category},${r.metric}').join('\n');
    const nullOutputPath = path.join(process.cwd(), 'null_metrics.csv');
    fs.writeFileSync(nullOutputPath, nullCsvContent);
    console.log('Null metrics CSV generated at: ' + nullOutputPath);
  } catch (error: any) {
    console.error('Error running the project:', error.message);
  }
}

run();