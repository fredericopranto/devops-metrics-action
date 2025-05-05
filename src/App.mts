import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { MetricsGenerator } from './MetricsGenerator.mjs';
import { MetricsExporter } from './MetricsExporter.mjs';

dotenv.config();

async function run(): Promise<void> {
  try {
    const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : null;
    const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : null;
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
        if (!repository || !category) {
          throw new Error(`Invalid entry in projects.csv: "${line}". Both repository and category must be defined.`);
        }
        return { repository: repository.trim(), category: category.trim() };
      });

    console.log(`${repositories.length} repository(ies) loaded from projects.csv.`);
    console.log('Start Date:', startDate ? startDate.toISOString() : 'Not defined');
    console.log('End Date:', endDate ? endDate.toISOString() : 'Not defined');
    

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      // request: {
      //   timeout: 30000,
      // },
    });
    const generator = new MetricsGenerator(octokit);
    
    const results = [];
    const nullResults = [];

    for (const { repository, category } of repositories) {
      try {
        const metrics = await generator.generateMetrics(repository, category, startDate, endDate);
        results.push(metrics);
      } catch (error: any) {
        console.error(`Error processing repository "${repository}":`, error.message);
        nullResults.push({ repository, category, metric: error.message });
      }
    }
    //MetricsExporter.exportToCSV(results, nullResults, process.cwd());
  } catch (error: any) {
    console.error('Error running the project:', error.message);
  }
}

run();