import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import type { Release } from './types/Release.js';
import type { IReleaseAdapter } from './interfaces/IReleaseAdapter.js';

export class ReleaseAdapter implements IReleaseAdapter {
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

  async GetAllReleasesLastMonth(): Promise<Release[] | undefined> {
    const since = new Date(this.today.valueOf() - 61 * 24 * 60 * 60 * 1000); // Go two months back
    console.log(`Fetching releases since: ${since.toISOString()}`);
    try {
      let result: Release[] | undefined = [];
      for (const repo of this.repositories) {
        console.log(`Fetching releases for repository: ${repo}`);
        let nextPage = await this.getReleases(repo, since, 1);
        console.log(`Fetched ${nextPage.length} releases from page 1`);
        result = result.concat(nextPage);
        for (let page = 2; page < 100 && nextPage.length === 100; page++) {
          nextPage = await this.getReleases(repo, since, page);
          console.log(`Fetched ${nextPage.length} releases from page ${page}`);
          result = result.concat(nextPage);
        }
      }
      console.log(`Total releases fetched: ${result.length}`);
      return result;
    } catch (e: any) {
      console.error(`Error fetching releases: ${e.message}`);
      core.setFailed(e.message);
    }
  }

  private async getReleases(
    repo: string,
    since: Date,
    page: number
  ): Promise<Release[]> {
    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/releases?state=all&since={since}&per_page={per_page}&page={page}',
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
    return Promise.resolve(result.data) as Promise<Release[]>;
  }
}
