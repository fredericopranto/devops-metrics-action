/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import type { IPullRequestsAdapter } from './interfaces/IPullRequestsAdapter.js';
import type { PullRequest } from './types/PullRequest.js';

export class PullRequestsAdapter implements IPullRequestsAdapter {
  octokit: Octokit;
  repositories: string[];
  owner: string;
  today: Date;

  constructor(octokit: Octokit, owner: string, repositories: string[]) {
    this.octokit = octokit;
    this.owner = owner;
    this.repositories = repositories;
    this.today = new Date();
  }

  async GetAllPRsLastMonth(): Promise<PullRequest[] | undefined> {
    const since = new Date(this.today.valueOf() - 61 * 24 * 60 * 60 * 1000); // Go two months back
    try {
      let result: PullRequest[] | undefined = [];
      for (const repo of this.repositories) {
        let nextPage = await this.getPRs(repo, since, 1);
        result = result.concat(nextPage);
        for (let page = 2; page < 100 && nextPage.length === 100; page++) {
          nextPage = await this.getPRs(repo, since, page);
          result = result.concat(nextPage);
        }
      }

      return result;
    } catch (e: any) {
      core.setFailed(e.message);
    }
  }

  private async getPRs(
    repo: string,
    since: Date,
    page: number
  ): Promise<PullRequest[]> {
    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/pulls?state=closed&since={since}&per_page={per_page}&page={page}',
      {
        owner: this.owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
        since: since.toISOString(),
        per_page: 100,
        page,
      }
    );

    return Promise.resolve(result.data) as Promise<PullRequest[]>;
  }
}
