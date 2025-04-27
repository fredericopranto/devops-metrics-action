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
    console.log('CSV generated at:', outputPath);

    const nullCsvContent =
      'Repository,Category,Metric\n' +
      nullResults.map(r => `${r.repository},${r.category},${r.metric}`).join('\n');
    const nullOutputPath = path.join(outputDir, 'null_metrics.csv');
    fs.writeFileSync(nullOutputPath, nullCsvContent);
    console.log('Null metrics CSV generated at:', nullOutputPath);
  }
}