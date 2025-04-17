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

  async GetAllReleases(since?: Date, until?: Date): Promise<Release[]> {
    try {
      let result: Release[] = [];
      let page = 1;

      while (true) {
        const params: any = {
          owner: this.owner,
          repo: this.repo,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
          per_page: 50,
          page,
        };

        if (since) {
          params.since = since.toISOString();
        }
        if (until) {
          params.until = until.toISOString();
        }

        const response = await this.octokit.request(
          'GET /repos/{owner}/{repo}/releases',
          params
        );

        const nextPage = response.data as Release[];
        result = result.concat(nextPage);

        if (nextPage.length < params.per_page) {
          break;
        }

        page++;
      }

      const rateLimit = await this.octokit.request('GET /rate_limit');
      console.log('Rate Limit:', rateLimit.data.rate);

      // Print the total number of releases evaluated
      console.log(`Total releases evaluated for the repository "${this.repo}": ${result.length}`);

      // Print the date/time of the first and last evaluated release
      if (result.length > 0) {
        const sortedReleases = result.sort((a, b) =>
          new Date(a.published_at || '').getTime() - new Date(b.published_at || '').getTime()
        );
        const firstRelease = sortedReleases[0];
        const lastRelease = sortedReleases[sortedReleases.length - 1];
        console.log(`First evaluated release: ${firstRelease.published_at}`);
        console.log(`Last evaluated release: ${lastRelease.published_at}`);
      }

      return result;
    } catch (e: any) {
      console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }
}
