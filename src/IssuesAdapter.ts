import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import { IIssuesAdapter } from './interfaces/IIssuesAdapter.js';
import { Issue } from './types/Issue.js';
import https from 'https'; // Importa o módulo HTTPS para configurar o agente

export class IssuesAdapter implements IIssuesAdapter {
  octokit: Octokit;
  owner: string;
  repo: string;
  today: Date;

  constructor(octokit: Octokit, owner: string, repo: string) {
    const agent = new https.Agent({
      rejectUnauthorized: false, 
    });

    this.octokit = new Octokit({
      auth: octokit.auth,
      request: {
        agent,
      },
    });

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
        nextPage = await this.getIssues(page, since);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length === 50);

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

    if (!Array.isArray(result.data)) {
      throw new Error(`Unexpected API response: ${JSON.stringify(result.data)}`);
    }

    console.log(`namespace: ${this.owner}/${this.repo}`);
    console.log(`Fetched ${result.data.length} issues from page ${page}`);
    console.log(`Fetched ${result.data} issues from page ${page}`);
    console.log(`Request Params:`, params);

    const issues = result.data.filter((issue: any) => !issue.pull_request);

    return issues as Issue[];
  }
}