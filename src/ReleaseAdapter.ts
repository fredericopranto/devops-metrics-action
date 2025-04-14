import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import type { Release } from './types/Release.js';
import type { IReleaseAdapter } from './interfaces/IReleaseAdapter.js';

export class ReleaseAdapter implements IReleaseAdapter {
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

  async GetAllReleases(since?: Date): Promise<Release[]> {
    try {
      let result: Release[] = [];
      let page = 1;
      let nextPage: Release[] = [];

      do {
        nextPage = await this.getReleases(since, page);
        result = result.concat(nextPage);
        page++;
      } while (nextPage.length === 100); // Continua enquanto houver 100 releases por página

      //console.log(`Total releases fetched for repository "${this.repo}": ${result.length}`);
      return result;
    } catch (e: any) {
      console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }

  private async getReleases(since: Date | undefined, page: number): Promise<Release[]> {
    const params: any = {
      owner: this.owner,
      repo: this.repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 100,
      page,
    };

    if (since) {
      params.since = since.toISOString();
    }

    const result = await this.octokit.request(
      'GET /repos/{owner}/{repo}/releases',
      params
    );

    //console.log(`Fetched ${result.data.length} releases from page ${page} for repository "${this.repo}"`);
    return result.data as Release[];
  }
}
