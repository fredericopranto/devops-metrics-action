import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import { IIssuesAdapter } from '../interfaces/IIssuesAdapter.js';
import { Issue } from '../types/Issue.js';
import https from 'https';
import dotenv from 'dotenv';
import { Logger } from '../utils/Logger.js';

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

  async GetAllIssuesGraphQL(since?: Date | null): Promise<Issue[] | null> {
    try {
      let result: Issue[] = [];
      let hasNextPage = true;
      let endCursor: string | null = null;
      let pageCount = 0;

      while (hasNextPage) {
        pageCount++;
        const response = await this.getIssuesGraphQL(endCursor, since);
        if (response.issues) {
          Logger.debug(`Retrieved ${response.issues.length} issues on page ${pageCount}`);
          result = result.concat(response.issues);
        }
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      return result;
    } catch (e: any) {
      console.error(`Error fetching issues via GraphQL for repository "${this.repo}": ${e.message}`);
      return [];
    }
  }

  private async getIssuesGraphQL(cursor: string | null, since?: Date | null): Promise<{
    issues: Issue[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const sinceFilter = since ? `, filterBy: {since: "${since.toISOString()}"}` : '';
    const cursorFilter = cursor ? `, after: "${cursor}"` : '';
    const perPage = parseInt(process.env.ISSUES_PER_PAGE || '50');


    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          issues(first: ${perPage}${cursorFilter}${sinceFilter}, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              id
              number
              title
              state
              createdAt
              updatedAt
              closedAt
              author {
                login
              }
              labels(first: 10) {
                nodes {
                  name
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    try {
      const result = await this.octokit.graphql(query, {
        owner: this.owner,
        repo: this.repo,
        request: {
          agent,
        },
      });

      const issues = (result as any).repository.issues.nodes.map((node: any) => ({
        id: node.id,
        number: node.number,
        title: node.title,
        state: node.state,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        closed_at: node.closedAt,
        user: node.author ? { login: node.author.login } : null,
        labels: node.labels.nodes.map((label: any) => ({ name: label.name })),
      }));

      return {
        issues,
        pageInfo: (result as any).repository.issues.pageInfo,
      };
    } catch (error: any) {
      if (error.status === 401) {
        console.error(`Authentication failed: ${error.message}`);
        throw new Error('Access denied: Invalid or insufficient permissions for the provided token.');
      }
      console.error(`Error fetching issues from GitHub GraphQL API: ${error.message}`);
      throw error;
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