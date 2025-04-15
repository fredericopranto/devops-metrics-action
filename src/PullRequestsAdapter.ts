/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import type { IPullRequestsAdapter } from './interfaces/IPullRequestsAdapter.js';
import type { PullRequest } from './types/PullRequest.js';

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

  async GetAllPRs(since?: Date): Promise<PullRequest[] | undefined> {
    try {
      let result: PullRequest[] = [];
      let page = 1;
      let nextPage: PullRequest[] = [];

      do {
        //console.log(`Fetching pull requests for repository "${this.repo}", page ${page}...`);
        nextPage = await this.getPRs(since, page);
        //console.log(`Fetched ${nextPage.length} pull requests from page ${page}`);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length === 100);

      //console.log(`Total pull requests fetched for repository "${this.repo}": ${result.length}`);
      return result;
    } catch (e: any) {
      console.error(`Error fetching pull requests for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }

  async getPRs(since: Date | undefined, page: number): Promise<PullRequest[]> {
    const params: any = {
      owner: this.owner,
      repo: this.repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 100,
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

    //console.log(`Fetched ${result.data.length} pull requests from page ${page} for repository "${this.repo}"`);
    return result.data as PullRequest[];
  }
}
