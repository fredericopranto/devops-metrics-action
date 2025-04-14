/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import { IIssuesAdapter } from './interfaces/IIssuesAdapter.js';
import { Issue } from './types/Issue.js';

export class IssuesAdapter implements IIssuesAdapter {
  octokit: Octokit;
  owner: string;
  repositories: string[];
  today: Date;

  constructor(octokit: Octokit, owner: string, repositories: string[]) {
    this.octokit = octokit;
    this.owner = owner;
    this.repositories = repositories;
    this.today = new Date();
  }

  async GetAllIssues(since?: Date): Promise<Issue[] | undefined> {
    console.log(
      `Fetching issues ${
        since ? `since: ${since.toISOString()}` : 'for all time'
      }`
    );
    try {
      let result: Issue[] = [];
      for (const repo of this.repositories) {
        console.log(`Fetching issues for repository: ${repo}`);
        let nextPage = await this.getIssues(repo, since, 1);
        console.log(`Fetched ${nextPage.length} issues from page 1`);
        result = result.concat(nextPage);
        for (let page = 2; page < 100 && nextPage.length === 100; page++) {
          nextPage = await this.getIssues(repo, since, page);
          console.log(`Fetched ${nextPage.length} issues from page ${page}`);
          result = result.concat(nextPage);
        }
      }
      console.log(`Total issues fetched: ${result.length}`);
      return result;
    } catch (e: any) {
      console.error(`Error fetching issues: ${e.message}`);
      core.setFailed(e.message);
    }
  }

  private async getIssues(
    repo: string,
    since: Date | undefined,
    page: number
  ): Promise<Issue[]> {
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

    console.log(
      `Requesting issues for repo: ${repo}, page: ${page}, ${
        since ? `since: ${since.toISOString()}` : 'no date filter'
      }`
    );

    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/issues',
      params
    );

    //console.log(`Response for repo: ${repo}, page: ${page}: ${result.data.length} issues`);
    return Promise.resolve(result.data) as Promise<Issue[]>;
  }
}
