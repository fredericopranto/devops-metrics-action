import { PullRequest } from './types/PullRequest.js';
import { Release } from './types/Release.js';
import { ICommitsAdapter } from './interfaces/ICommitsAdapter.js';
import { Commit } from './types/Commit.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

export class LeadTime {
  log: string[] = [];
  pulls: PullRequest[];
  releases: {
    published: number;
    url: string;
    name: string;
    published_at: string;
  }[];
  today: Date;
  commitsAdapter: ICommitsAdapter;

  constructor(
    pulls: PullRequest[],
    releases: Release[],
    commitsAdapter: ICommitsAdapter,
    today: Date | null = null
  ) {
    this.today = today ? today : new Date();

    this.pulls = pulls;

    this.releases = releases.map((r) => {
      return {
        published: +new Date(r.published_at),
        url: r.url,
        name: r.name,
        published_at: r.published_at,
      };
    });

    this.commitsAdapter = commitsAdapter;
  }

  async getLeadTime(filtered = false): Promise<number | null>{
    if (this.pulls.length === 0 || this.releases.length === 0) {
      return null;
    }

    const leadTimes: number[] = [];
    let processedCount = 0;

    for (const pull of this.pulls) {
      processedCount++;
      console.log(`Processing PR ${processedCount}/${this.pulls.length}: ${pull.title}`);

      if (
        typeof pull.merged_at === 'string' &&
        pull.merged_at &&
        typeof pull.base.repo.name === 'string' &&
        pull.base.repo.name &&
        pull.base.ref === 'main'
      ) {
        const mergeTime = +new Date(pull.merged_at);
        console.log(`Merge time for PR "${pull.title}": ${new Date(mergeTime).toISOString()}`);

        const laterReleases = this.releases.filter(
          (r) => r.published > mergeTime && r.url.includes(pull.base.repo.name)
        );
        if (laterReleases.length === 0) {
          continue;
        }

        const deployTime: number = laterReleases[0].published;
        console.log(`Deploy time for PR "${pull.title}": ${new Date(deployTime).toISOString()}`);

        const commits = (await this.commitsAdapter.getCommitsFromUrl(
          pull.commits_url
        )) as Commit[];

        if (commits.length === 0) {
          continue;
        }

        const commitTime: number = commits
          .map((c) => +new Date(c.commit.committer.date))
          .sort((a, b) => a - b)[0];

        const leadTime = (deployTime - commitTime) / ONE_DAY;
        leadTimes.push(leadTime);
      }
    }

    if (leadTimes.length === 0) {
      return null;
    }

    const averageLeadTime =
      Math.round((leadTimes.reduce((p, c) => p + c) / leadTimes.length) * 100) / 100;
    return averageLeadTime;
  }
}
