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

  async GetAllPRs(since?: Date): Promise<PullRequest[] | undefined> {
    // console.log(
    //   `Fetching pull requests ${
    //     since ? `since: ${since.toISOString()}` : 'for all time'
    //   }`
    // );
    try {
      let result: PullRequest[] = [];
      for (const repo of this.repositories) {
        //console.log(`Fetching pull requests for repository: ${repo}`);
        let nextPage = await this.getPRs(repo, since, 1);
        //console.log(`Fetched ${nextPage.length} pull requests from page 1`);
        result = result.concat(nextPage);
        for (let page = 2; page < 100 && nextPage.length === 100; page++) {
          nextPage = await this.getPRs(repo, since, page);
          //console.log(`Fetched ${nextPage.length} pull requests from page ${page}`);
          result = result.concat(nextPage);
        }
      }
      //console.log(`Total pull requests fetched: ${result.length}`);
      return result;
    } catch (e: any) {
      console.error(`Error fetching pull requests: ${e.message}`);
      core.setFailed(e.message);
    }
  }

  private async getPRs(
    repo: string,
    since: Date | undefined,
    page: number
  ): Promise<PullRequest[]> {
    const params: any = {
      owner: this.owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 100,
      page,
    };

    if (since) {
      params.since = since.toISOString();
    }

    // console.log(
    //   `Requesting pull requests for repo: ${repo}, page: ${page}, ${
    //     since ? `since: ${since.toISOString()}` : 'no date filter'
    //   }`
    // );

    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/pulls?state=closed',
      params
    );

    //console.log(`Response for repo: ${repo}, page: ${page}: ${result.data.length} pull requests`);
    return Promise.resolve(result.data) as Promise<PullRequest[]>;
  }
}
