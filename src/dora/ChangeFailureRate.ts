import type { Issue } from '../types/Issue.js';
import type { Release } from '../types/Release.js';
import { Logger } from '../utils/Logger.js';
import dotenv from 'dotenv';

dotenv.config();

export class ChangeFailureRate {
  bugs: Issue[];
  releases: Release[];

  constructor(bugs: Issue[], releases: Release[]) {
    this.bugs = bugs;
    this.releases = releases.sort((a, b) =>
      +new Date(a.published_at || a.created_at) < +new Date(b.published_at || b.created_at) ? -1 : 1
    );
  }

  Cfr(): number | null {
    if (this.bugs.length === 0) {
      return 0;
    }

    if (this.releases.length === 0) {
      return null;
    }

    const validReleases = this.releases.filter(release => release.published_at || release.created_at);
    if (validReleases.length === 0) {
      return null;
    }

    const releaseDates = validReleases.map(release => ({
      published: +new Date(release.published_at || release.created_at)
    }));

    let failedDeploys = 0;

    for (let i = 0; i < releaseDates.length - 1; i++) {
      const bugsInRange = this.bugs.filter(bug => {
        const bugDate = +new Date(bug.created_at);
        return (
          bugDate > releaseDates[i].published &&
          bugDate < releaseDates[i + 1].published
        );
      });

      Logger.debug(`Release ${this.releases[i].name} has ${bugsInRange.length} bugs associated.`);

      if (bugsInRange.length > 0) {
        failedDeploys += 1;
      }
    }

    const bugsAfterLastRelease = this.bugs.filter(bug => {
      const bugDate = +new Date(bug.created_at);
      return bugDate > releaseDates[releaseDates.length - 1].published;
    });

    if (bugsAfterLastRelease.length > 0) {
      failedDeploys += 1;
    }

    return Math.round((failedDeploys / releaseDates.length) * 100);
  }
}