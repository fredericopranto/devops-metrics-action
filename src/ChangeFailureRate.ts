import dotenv from 'dotenv';
dotenv.config();

import type { Issue } from './types/Issue.js';
import type { Release } from './types/Release.js';

export class ChangeFailureRate {
  issues: Issue[];
  releases: Release[];

  constructor(issues: Issue[], releases: Release[]) {
    this.issues = issues;
    this.releases = releases.sort((a, b) =>
      +new Date(a.published_at) < +new Date(b.published_at) ? -1 : 1
    );
  }

  getBugs(): Issue[] {
    const bugLabels = (process.env.BUG_LABEL || 'bug').split(',').map(label => label.trim()); 
    return this.issues.filter(issue =>
      issue.labels.some(label => bugLabels.includes(label.name))
    );
  }

  Cfr(): number {
    if (this.issues.length === 0 || this.releases.length === 0) {
      return 0;
    }

    const bugs = this.getBugs();

    // Mapear datas de releases
    const releaseDates = this.releases.map(release => ({
      published: +new Date(release.published_at),
      url: release.url,
    }));

    let failedDeploys = 0;

    // Verificar bugs entre releases consecutivas
    for (let i = 0; i < releaseDates.length - 1; i++) {
      const bugsInRange = bugs.filter(bug => {
        const bugDate = +new Date(bug.created_at);
        return (
          bugDate > releaseDates[i].published &&
          bugDate < releaseDates[i + 1].published
        );
      });

      if (bugsInRange.length > 0) {
        failedDeploys += 1;
      }
    }

    // Verificar bugs após a última release
    const bugsAfterLastRelease = bugs.filter(bug => {
      const bugDate = +new Date(bug.created_at);
      return bugDate > releaseDates[releaseDates.length - 1].published;
    });

    if (bugsAfterLastRelease.length > 0) {
      failedDeploys += 1; // Contabiliza falhas após a última release
    }

    return Math.round((failedDeploys / releaseDates.length) * 100);
  }
}
