import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import { IIssuesAdapter } from '../interfaces/IIssuesAdapter.js';
import { Issue } from '../types/Issue.js';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

export class IssuesAdapter implements IIssuesAdapter {
  octokit: Octokit;
  owner: string;
  repo: string;

  constructor(octokit: Octokit, owner: string, repo: string) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
  }

  async GetAllIssues(since?: Date | null): Promise<Issue[] | null> {
    try {
      let result: Issue[] = [];
      let page = 1;
      let nextPage: Issue[] = [];

      do {
        nextPage = await this.getIssues(page, since);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length > 0);

      return result;
    } catch (e: any) {
      console.error(`Error fetching issues for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }

  private async getIssues(page: number, since?: Date | null): Promise<Issue[]> {
    const params: any = {
      owner: this.owner,
      repo: this.repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: parseInt(process.env.ISSUES_PER_PAGE || '50'),
      page,
      state: 'all',
    };

    if (since) {
      params.since = since.toISOString();
    }

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    let result;
    try {
      result = await this.octokit.request(
        'GET /repos/{owner}/{repo}/issues',
        {
          ...params,
          request: {
            agent,
          },
        }
      );
    } catch (error: any) {
      if (error.status === 401) {
        console.error(`Authentication failed: ${error.message}`);
        throw new Error('Access denied: Invalid or insufficient permissions for the provided token.');
      }
      console.error(`####### Error fetching issues from GitHub API: ${error.message}`);
      throw error;
    }

    if (!Array.isArray(result.data)) {
      throw new Error(`Unexpected API response: ${JSON.stringify(result.data)}`);
    }

    const issues = result.data.filter((issue: any) => !issue.pull_request);

    return issues as Issue[];
  }
}