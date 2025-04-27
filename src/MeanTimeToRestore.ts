import {Issue} from './types/Issue.js'
import {Release} from './types/Release.js'

export interface BugTime {
  start: number
  end: number
  repo: string
}

export interface ReleaseDate {
  published: number
  url: string
}

const ONE_DAY = 1000 * 60 * 60 * 24

export class MeanTimeToRestore {
  issues: Issue[];
  releases: Release[];
  releaseDates: ReleaseDate[];

  constructor(issues: Issue[], releases: Release[]) {
    this.issues = issues
    this.releases = releases
    
    this.releaseDates = this.releases
      .map(function (r) {
        return {published: +new Date(r.published_at || r.created_at), url: r.url} })
      .sort((a, b) => a.published - b.published)
  }

  getBugCount(): BugTime[] {
    const bugs: Issue[] = this.getIssuesTaggedAsBug()
    const values: BugTime[] = this.getStartAndEndTimesForBugs(bugs)

    return values
  }

  private getStartAndEndTimesForBugs(bugs: Issue[]): BugTime[] {
    const values: BugTime[] = [];
    for (const bug of bugs) {
      const createdAt = +new Date(bug.created_at);
      const closedAt = +new Date(bug.closed_at as string);
      const repoName = bug.repository_url.split('/').reverse()[0];
      if (!bug.closed_at) {
        continue;
      }
      if (!this.hasLaterRelease(closedAt, repoName)) {
        continue;
      }
      if (!this.hasPreviousRelease(createdAt, repoName)) {
        continue;
      }
      values.push({
        start: createdAt,
        end: closedAt,
        repo: repoName,
      });
    }
    return values;
  }

  private getIssuesTaggedAsBug(): Issue[] {
    const bugs: Issue[] = [];
    for (const issue of this.issues) {
      if (issue.labels.filter(label => label.name === 'bug').length > 0) {
        bugs.push(issue);
      }
    }
    return bugs;
  }

  hasPreviousRelease(date: number, repo: string): boolean {
    return (
      this.releaseDates.filter(r => r.published < date && r.url.includes(repo))
        .length > 0
    )
  }

  getReleaseBefore(date: number, repo: string): ReleaseDate {
    const rdates: ReleaseDate[] = this.releaseDates.filter(
      r => r.published < date && r.url.includes(repo)
    )

    if (rdates.length === 0) {
      throw new Error('No previous releases')
    }

    return rdates.pop() as ReleaseDate
  }

  getReleaseAfter(date: number, repo: string): ReleaseDate {
    const rdates: ReleaseDate[] = this.releaseDates.filter(
      r => r.published > date && r.url.includes(repo)
    )

    if (rdates.length === 0) {
      throw new Error('No later releases')
    }

    return rdates.reverse().pop() as ReleaseDate
  }

  hasLaterRelease(date: number, repo: string): boolean {
    return (
      this.releaseDates.filter(r => r.published > date && r.url.includes(repo))
        .length > 0
    )
  }

  getRestoreTime(bug: BugTime): number {
    const prevRel = this.getReleaseBefore(bug.start, bug.repo)
    const nextRel = this.getReleaseAfter(bug.end, bug.repo)

    return nextRel.published - prevRel.published
  }

  mttr(): number | null {
    if (this.releases === null || this.releases.length === 0) {
      return null;
    }

    const ttr: number[] = this.getBugCount().map(bug => {
      return this.getRestoreTime(bug);
    });

    if (ttr.length === 0) {
      return 0;
    }

    let sum = 0;
    for (const ttrElement of ttr) {
      sum += ttrElement;
    }

    const mttr = Math.round((sum / ttr.length / ONE_DAY) * 100) / 100;
    return mttr;
  }
}