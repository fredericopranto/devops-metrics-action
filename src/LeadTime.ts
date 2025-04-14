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

    // Removido o filtro de 31 dias
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

  getLog(): string[] {
    return this.log;
  }

  async getLeadTime(filtered = false): Promise<number> {
    if (this.pulls.length === 0 || this.releases.length === 0) {
      console.log('No pull requests or releases available.');
      return 0;
    }

    if (filtered) {
      this.log.push(`\nLog is filtered - only feat and fix.`);
    }

    console.log(`Starting Lead Time calculation for ${this.pulls.length} pull requests...`);
    const leadTimes: number[] = [];
    let processedCount = 0; // Contador para acompanhar o progresso

    for (const pull of this.pulls) {
      processedCount++;
      //console.log(`Processing PR ${processedCount}/${this.pulls.length}: ${pull.title}`);

      if (
        typeof pull.merged_at === 'string' &&
        pull.merged_at &&
        typeof pull.base.repo.name === 'string' &&
        pull.base.repo.name &&
        pull.base.ref === 'master'
      ) {
        if (
          filtered &&
          !(pull.title.startsWith('feat') || pull.title.startsWith('fix'))
        ) {
          //console.log(`Skipping PR due to filter: ${pull.title}`);
          continue;
        }

        const mergeTime = +new Date(pull.merged_at);
        //console.log(`Merge time for PR "${pull.title}": ${new Date(mergeTime).toISOString()}`);

        const laterReleases = this.releases.filter(
          (r) => r.published > mergeTime && r.url.includes(pull.base.repo.name)
        );
        if (laterReleases.length === 0) {
          //console.log(`No releases found for PR "${pull.title}" after merge.`);
          continue;
        }

        const deployTime: number = laterReleases[0].published;
        //console.log(`Deploy time for PR "${pull.title}": ${new Date(deployTime).toISOString()}`);

        this.log.push(`pull->      ${pull.merged_at} : ${pull.title}`);

        //console.time(`Fetching commits for PR: ${pull.title}`);
        const commits = (await this.commitsAdapter.getCommitsFromUrl(
          pull.commits_url
        )) as Commit[];
        //console.timeEnd(`Fetching commits for PR: ${pull.title}`);

        if (commits.length === 0) {
          console.log(`No commits found for PR "${pull.title}".`);
          continue;
        }

        const commitTime: number = commits
          .map((c) => +new Date(c.commit.committer.date))
          .sort((a, b) => a - b)[0];
        //console.log(`First commit time for PR "${pull.title}": ${new Date(commitTime).toISOString()}`);

        const firstCommit = commits.sort((a, b) => {
          return (
            +new Date(a.commit.committer.date) -
            +new Date(b.commit.committer.date)
          );
        })[0];
        this.log.push(
          `  commit->  ${firstCommit.commit.committer.date} : ${firstCommit.commit.message}`
        );
        this.log.push(
          `  release-> ${laterReleases[0].published_at} : ${laterReleases[0].name}`
        );

        const leadTime = (deployTime - commitTime) / ONE_DAY;
        leadTimes.push(leadTime);
        //console.log(`Lead Time for PR "${pull.title}": ${leadTime.toFixed(2)} days`);
        this.log.push(`  ${leadTime.toFixed(2)} days`);
      } else {
        //console.log(`Skipping PR "${pull.title}" - Not merged into master.`);
      }
    }

    //console.log(`Finished processing ${processedCount}/${this.pulls.length} pull requests.`);

    if (leadTimes.length === 0) {
      console.log('No valid Lead Times calculated.');
      return 0;
    }

    const averageLeadTime =
      Math.round((leadTimes.reduce((p, c) => p + c) / leadTimes.length) * 100) /
      100;
    //console.log(`Average Lead Time: ${averageLeadTime} days`);
    return averageLeadTime;
  }
}
