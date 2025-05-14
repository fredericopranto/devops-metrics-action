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
    const metadataList = [];

    for (const { repository, category } of repositories) {
      try {
        const exists = await MetricsExporter.metricExists(repository, category);
        if (exists) {
          continue;
        }

        const metrics = await generator.generateMetrics(repository, category, startDate, endDate);
        if (metrics) {
          results.push(metrics);

          const metadataExists = await MetricsExporter.metaDataExists(repository, category);
          if (!metadataExists) {
            metadataList.push({
              repository: metrics.repository,
              category: metrics.category,
              ...metrics.metadata,
            });
          }

          if (!Array.isArray(results) || results.length === 0) {
            console.error('Empty projects.');
            return;
          }

          try {
            MetricsExporter.exportMetricsToDatabase(results);
          } catch (error: any) {
            console.error('Error exporting metrics to Database:', error.message);
          }

          try {
            if (!metadataExists) {
              await MetricsExporter.exportMetadataToDatabase(metadataList);
            }
          } catch (error: any) {
            console.error('Error exporting metadata to Database:', error.message);
          }
        }
      } catch (error: any) {
        console.error(`Error processing repository "${repository}":`, error.message);
      }
    }

    try {
      MetricsExporter.exportMetricsToCSV(results);
    } catch (error: any) {
      console.error('Error exporting metrics to CSV:', error.message);
    }
  } catch (error: any) {
    console.error('Unhandled error occurred while running the project:', error.message);
  }
}

run();