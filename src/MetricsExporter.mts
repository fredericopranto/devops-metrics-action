import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

export class MetricsExporter {
  
  static exportToCSV(results: any[]) {
    if (!Array.isArray(results) || results.length === 0) {
      console.error('Invalid or empty results array provided.');
      return;
    }

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

  static async exportToDatabase(results: any[]) {
    if (!Array.isArray(results) || results.length === 0) {
      console.error('Invalid or empty results array provided.');
      return;
    }

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
          createdAt TEXT NOT NULL
        )
      `);

      const stmt = db.prepare(`
        INSERT INTO metrics (
          repository, category, dfValue, dfLevel, ltValue, ltLevel, cfrValue, cfrLevel, mttrValue, mttrLevel, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      results.forEach(result => {
        stmt.run(
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

      stmt.finalize();
    });

    db.close(err => {
      if (err) {
        console.error('Error closing the database:', err.message);
      } else {
        console.log(`Metrics successfully saved to the database at ${dbPath}`);
      }
    });
  }

  static async metricExists(repository: string, category: string): Promise<boolean> {
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
}