// filepath: c:\work\DOUTORADO\devops-metrics-action\src\index2.ts
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import { ReleaseAdapter } from './ReleaseAdapter.js';
import { DeployFrequency } from './DeployFrequency.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

export async function run(): Promise<void> {
  try {
    const token = process.env.GITHUB_TOKEN || '';
    const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : undefined;
    const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : undefined;

    if (!token) {
      throw new Error('Please configure the GITHUB_TOKEN variable in the .env file');
    }

    // Load repositories and categories from projects.csv
    const projectsFilePath = path.join(process.cwd(), 'projects.csv');
    if (!fs.existsSync(projectsFilePath)) {
      throw new Error(`File projects.csv not found at ${projectsFilePath}`);
    }

    const projectsData = fs.readFileSync(projectsFilePath, 'utf-8');
    const repositories = projectsData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//')) // Ignore empty lines and comments
      .map(line => {
        const [repository, category] = line.split(',');
        return { repository: repository.trim(), category: category.trim() };
      });

    console.log(`${repositories.length} repository(ies) loaded from projects.csv.`);
    console.log(`Start Date: ${startDate ? startDate.toISOString() : 'Not defined'}`);
    console.log(`End Date: ${endDate ? endDate.toISOString() : 'Not defined'}`);

    // Create a single Octokit instance with fetch
    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    const results: { repository: string; category: string; df: number | null }[] = [];

    for (const { repository, category } of repositories) {
      console.log(`>>>> Processing repository: ${repository} (Category: ${category})`);

      const [owner, repo] = repository.split('/');

      // Deployment Frequency
      const rel = new ReleaseAdapter(octokit, owner, repo);
      const releaseList = (await rel.GetAllReleases(startDate, endDate)) || [];
      const df = new DeployFrequency(releaseList, startDate, endDate);
      const rate = df.rate();
      console.log(`Deployment Frequency (days):`, rate);

      // Add to results
      results.push({ repository, category, df: rate });
    }

    // Generate the CSV
    const csvContent =
      'Repository,Category,Deployment Frequency (DF)\n' +
      results.map(r => `${r.repository},${r.category},${r.df}`).join('\n');
    const outputPath = path.join(process.cwd(), 'df_metrics.csv');
    fs.writeFileSync(outputPath, csvContent);

    console.log(`CSV generated at: ${outputPath}`);
  } catch (error: any) {
    console.error('Error running the project:', error.message);
  }
}

run();