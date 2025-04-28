/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import type { IPullRequestsAdapter } from '../interfaces/IPullRequestsAdapter.js';
import type { PullRequest } from '../types/PullRequest.js';

export class PullRequestsAdapter implements IPullRequestsAdapter {
  octokit: Octokit;
  owner: string;
  repo: string;
  today: Date;

  constructor(octokit: Octokit, owner: string, repo: string) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
    this.today = new Date();
  }

  async GetAllPRs(since?: Date): Promise<PullRequest[] | null> {
    try {
      let result: PullRequest[] = [];
      let page = 1;
      let nextPage: PullRequest[] = [];

      do {
        nextPage = await this.getPRs(page, since);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length === 50);

      return result;
    } catch (e: any) {
      console.error(`Error fetching pull requests for repository "${this.repo}": ${e.message}`);
      return [];
    }
  }

  async getPRs(page: number, since? : Date): Promise<PullRequest[]> {
    const params: any = {
      owner: this.owner,
      repo: this.repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 50,
      page,
      state: 'closed',
    };

    if (since) {
      params.since = since.toISOString();
    }

    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/pulls',
      params
    );

    return result.data as PullRequest[];
  }
}
