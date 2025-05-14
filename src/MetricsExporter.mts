import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

export class MetricsExporter {
  
  static exportMetricsToCSV(results: any[]) {
    const csvContent =
      'repository,category,dfValue,dfLevel,ltValue,ltLevel,cfrValue,cfrLevel,mttrValue,mttrLevel\n' +
      results
        .filter(r => {
          if (
            !r ||
            !r.repository ||
            !r.category ||
            r.dfValue === undefined ||
            r.dfLevel === undefined ||
            r.ltValue === undefined ||
            r.ltLevel === undefined ||
            r.cfrValue === undefined ||
            r.cfrLevel === undefined ||
            r.mttrValue === undefined ||
            r.mttrLevel === undefined
          ) {
            console.error('Invalid result object:', r);
            return false;
          }
          return true;
        })
        .map(r => `${r.repository},${r.category},${r.dfValue},${r.dfLevel},${r.ltValue},${r.ltLevel},${r.cfrValue},${r.cfrLevel},${r.mttrValue},${r.mttrLevel}`)
        .join('\n');

    const outputPath = path.join(process.cwd(), 'metrics.csv');
    try {
      fs.writeFileSync(outputPath, csvContent);
      console.log(`Metrics exported successfully to ${outputPath}`);
    } catch (error) {
      console.error('Error writing CSV file:', error);
    }
  }

  static async exportMetricsToDatabase(results: any[]) {
    const dbPath = 'metrics.db';
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repository TEXT NOT NULL,
          category TEXT NOT NULL,
          dfValue REAL,
          dfLevel TEXT,
          ltValue REAL,
          ltLevel TEXT,
          cfrValue INTEGER,
          cfrLevel TEXT,
          mttrValue REAL,
          mttrLevel TEXT,
          createdAt TEXT NOT NULL,
          UNIQUE(repository, category)
        )
      `);

      const stmtInsertOrUpdate = db.prepare(`
        INSERT INTO metrics (
          repository, category, dfValue, dfLevel, ltValue, ltLevel, cfrValue, cfrLevel, mttrValue, mttrLevel, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(repository, category) DO UPDATE SET
          dfValue = excluded.dfValue,
          dfLevel = excluded.dfLevel,
          ltValue = excluded.ltValue,
          ltLevel = excluded.ltLevel,
          cfrValue = excluded.cfrValue,
          cfrLevel = excluded.cfrLevel,
          mttrValue = excluded.mttrValue,
          mttrLevel = excluded.mttrLevel,
          createdAt = excluded.createdAt
      `);

      results.forEach(result => {
        stmtInsertOrUpdate.run(
          result.repository,
          result.category,
          result.dfValue,
          result.dfLevel,
          result.ltValue,
          result.ltLevel,
          result.cfrValue,
          result.cfrLevel,
          result.mttrValue,
          result.mttrLevel,
          new Date().toISOString()
        );
      });

      stmtInsertOrUpdate.finalize();
    });

    db.close(err => {
      if (err) {
        console.error('Error closing the database:', err.message);
      } else {
        console.log(`Metrics successfully saved or updated in the database at ${dbPath}`);
      }
    });
  }

  static async metricExists(repository: string, category: string): Promise<boolean> {
    const recollect = process.env.RECOLLECT === 'true'; // Verifica a flag RECOLLECT
    if (recollect) {
      return false;
    }

    const dbPath = 'metrics.db';
    const db = new sqlite3.Database(dbPath);

    const has = new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM metrics WHERE repository = ? AND category = ? ORDER BY createdAt DESC LIMIT 1`,
        [repository, category],
        (err, row: { [key: string]: any } | undefined) => {
          if (err) {
            console.error('Error querying the database:', err.message);
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    }).finally(() => {
      db.close();
    });

    return has as Promise<boolean>;
  }

  static async exportMetadataToDatabase(metadataList: any[]) {
    const dbPath = 'metrics.db';
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repository TEXT NOT NULL,
          category TEXT NOT NULL,
          totalReleases INTEGER,
          totalIssues INTEGER,
          totalBugs INTEGER,
          totalPullRequests INTEGER,
          totalCommits INTEGER,
          createdAt TEXT NOT NULL,
          UNIQUE(repository, category)
        )
      `);

      const stmtInsertOrUpdate = db.prepare(`
        INSERT INTO metadata (
          repository, category, totalReleases, totalIssues, totalBugs, totalPullRequests, totalCommits, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(repository, category) DO UPDATE SET
          totalReleases = excluded.totalReleases,
          totalIssues = excluded.totalIssues,
          totalBugs = excluded.totalBugs,
          totalPullRequests = excluded.totalPullRequests,
          totalCommits = excluded.totalCommits,
          createdAt = excluded.createdAt
      `);

      metadataList.forEach(metadata => {
        stmtInsertOrUpdate.run(
          metadata.repository,
          metadata.category,
          metadata.totalReleases,
          metadata.totalIssues,
          metadata.totalBugs,
          metadata.totalPullRequests,
          metadata.totalCommits,
          new Date().toISOString()
        );
      });

      stmtInsertOrUpdate.finalize();
    });

    db.close(err => {
      if (err) {
        console.error('Error closing the database:', err.message);
      } else {
        console.log(`Metadata successfully saved or updated in the database at ${dbPath}`);
      }
    });
  }

  static async metaDataExists(repository: string, category: string): Promise<boolean> {
    const recollect = process.env.RECOLLECT === 'true';
    if (recollect) {
      return false;
    }

    const dbPath = 'metrics.db';
    const db = new sqlite3.Database(dbPath);

    const hasMetadata = new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM metadata WHERE repository = ? AND category = ? ORDER BY createdAt DESC LIMIT 1`,
        [repository, category],
        (err, row: { [key: string]: any } | undefined) => {
          if (err) {
            console.error('Error querying the database for metadata:', err.message);
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    }).finally(() => {
      db.close();
    });

    return hasMetadata as Promise<boolean>;
  }
}