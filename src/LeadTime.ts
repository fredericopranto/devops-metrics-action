import { PullRequest } from './types/PullRequest.js';
import { Release } from './types/Release.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

export class LeadTime {
  pulls: PullRequest[];
  releases: Release[];

  constructor(pulls: PullRequest[], releases: Release[]) {
    this.pulls = pulls;
    this.releases = releases;
  }

  getLeadTime(): number | null {
    if (this.pulls.length === 0 || this.releases.length === 0) {
      return null;
    }

    const leadTimes: number[] = [];

    for (const pull of this.pulls) {

      if (
        typeof pull.merged_at === 'string' && pull.merged_at &&
        typeof pull.base.repo.name === 'string' && pull.base.repo.name &&
        pull.base.ref === pull.default_branch || 'main')
      {
        const mergeTime = +new Date(pull.merged_at);

        const sortedReleases = this.releases.sort(
          (a, b) => +new Date(a.published_at || a.created_at) - +new Date(b.published_at || b.created_at)
        );

        const laterReleases = sortedReleases.filter(
          (r) => +new Date(r.published_at || r.created_at) >= mergeTime
        );

        if (laterReleases.length === 0) {
          continue;
        }

        const deployTime: number = +new Date(laterReleases[0].published_at || laterReleases[0].created_at);

        const commitTime: number = pull.commits!
          .map((c) => +new Date(c.commit.committer.date))
          .sort((a, b) => a - b)[0];

        const leadTime = (deployTime - commitTime) / ONE_DAY;
        leadTimes.push(leadTime);
      }
    }

    if (leadTimes.length === 0) {
      return null;
    }

    console.log(`Lead times (in days): ${leadTimes.map(lt => lt.toFixed(2)).join(', ')}`);

    const averageLeadTime =
      Math.round((leadTimes.reduce((p, c) => p + c) / leadTimes.length) * 100) / 100;

    return averageLeadTime;
  }
}
