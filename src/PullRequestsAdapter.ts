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
        nextPage = await this.getPRs(since, page);
        console.log(`Fetched ${nextPage.length} pull requests from page ${page}`);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length === 50);

      console.log(`Total pull requests fetched for repository "${this.repo}": ${result.length}`);
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

  async getPullRequestsGraphQL(startDate?: Date, endDate?: Date): Promise<PullRequest[]> {
    const query = `
      query ($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(
            first: 50,
            after: $cursor,
            states: CLOSED,
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            edges {
              node {
                id
                number
                title
                state
                createdAt
                updatedAt
                closedAt
                mergedAt
                baseRefName
                headRefName
                url
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

    const variables: any = {
      owner: this.owner,
      repo: this.repo,
      cursor: null,
    };

    let pullRequests: PullRequest[] = [];
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.octokit.graphql<any>(query, variables);
      const edges = response.repository.pullRequests.edges;

      // Filtrar PRs pelo intervalo de datas
      const filteredPRs = edges
        .map((edge: any) => edge.node)
        .filter((pr: any) => {
          const closedAt = new Date(pr.closedAt);
          return (!startDate || closedAt >= startDate) && (!endDate || closedAt <= endDate);
        });

      pullRequests = pullRequests.concat(filteredPRs);

      // Atualizar paginação
      hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
      variables.cursor = response.repository.pullRequests.pageInfo.endCursor;
    }

    return pullRequests;
  }
}
