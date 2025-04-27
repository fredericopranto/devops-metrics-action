/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import { IIssuesAdapter } from './interfaces/IIssuesAdapter.js';
import { Issue } from './types/Issue.js';

export class IssuesAdapter implements IIssuesAdapter {
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

  async GetAllIssues(since?: Date): Promise<Issue[] | null> {
    try {
      let result: Issue[] = [];
      let page = 1;
      let nextPage: Issue[] = [];

      do {
        //console.log(`Fetching issues for repository "${this.repo}", page ${page}...`);
        nextPage = await this.getIssues(page,since);
        //console.log(`Fetched ${nextPage.length} issues from page ${page}`);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length === 50); 

      //console.log(`Total issues fetched for repository "${this.repo}": ${result.length}`);
      return result;
    } catch (e: any) {
      console.error(`Error fetching issues for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }

  private async getIssues(page: number, since?: Date): Promise<Issue[]> {
    const params: any = {
      owner: this.owner,
      repo: this.repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 50,
      page,
      state: 'all', 
    };

    if (since) {
      params.since = since.toISOString();
    }

    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/issues',
      params
    );

    // Filtrar apenas issues (excluindo pull requests)
    const issues = result.data.filter((issue: any) => !issue.pull_request);

    //console.log(`Fetched ${issues.length} issues for repo: "${this.repo}", page: ${page}`);
    return issues as Issue[];
  }
}