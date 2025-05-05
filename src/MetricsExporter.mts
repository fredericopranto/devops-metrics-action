import fs from 'fs';
import path from 'path';

export class MetricsExporter {
  static exportToCSV(results: any[], nullResults: any[], outputDir: string) {
    const csvContent =
      'Repository,Category,Deployment Frequency (DF),DF Level,Lead Time (days),LT Level,Change Failure Rate (CFR),CFR Level,Mean Time to Restore (MTTR),MTTR Level\n' +
      results
        .map(r =>
          `${r.repository},${r.category},${r.dfValue},${r.dfLevel},${r.ltValue},${r.ltLevel},${r.cfrValue},${r.cfrLevel},${r.mttrValue},${r.mttrLevel}`
        )
        .join('\n');

    const outputPath = path.join(outputDir, 'metrics.csv');
    fs.writeFileSync(outputPath, csvContent);

    const nullCsvContent =
      'Repository,Category,Metric\n' +
      nullResults.map(r => `${r.repository},${r.category},${r.metric}`).join('\n');
    const nullOutputPath = path.join(outputDir, 'null_metrics.csv');
    fs.writeFileSync(nullOutputPath, nullCsvContent);
  }

  static exportToConsole(results: any[], nullResults: any[]) {
    if (results.length === 0) {
      console.log('No metrics available.');
    } else {
      results.forEach(r => {
        console.log(
          `${r.repository}, ${r.category}, ${r.dfValue}, ${r.dfLevel}, ${r.ltValue}, ${r.ltLevel}, ${r.cfrValue}, ${r.cfrLevel}, ${r.mttrValue}, ${r.mttrLevel}`
        );
      });
    }

    if (nullResults.length > 0) {
      console.log('\n=== Null Metrics Report ===');
      console.log('Repository, Category, Metric');
      nullResults.forEach(r => {
        console.log(`${r.repository}, ${r.category}, ${r.metric}`);
      });
    }
  }
}