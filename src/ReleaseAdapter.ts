import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import type { Release } from './types/Release.js';
import type { IReleaseAdapter } from './interfaces/IReleaseAdapter.js';

export class ReleaseAdapter implements IReleaseAdapter {
  octokit: Octokit;
  owner: string;
  repo: string;

  constructor(octokit: Octokit, owner: string, repo: string) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
  }

  async GetAllReleases(since: Date | null, until: Date | null): Promise<Release[]> {
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

        const baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/releases`;
        const queryParams = `?per_page=${params.per_page}&page=${params.page}`;
        const fullUrl = `${baseUrl}${queryParams}`;
        //console.log(`Requesting URL: ${fullUrl}`);

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

      const filteredReleases = result.filter(release => {
        const publishedAt = new Date(release.published_at || release.created_at);
        if (release.prerelease) return false;
        if (since && publishedAt < since) return false;
        if (until && publishedAt > until) return false;
        return true;
      });

      const rateLimit = await this.octokit.request('GET /rate_limit');
      //console.log('Rate Limit:', rateLimit.data.rate);

      if (filteredReleases.length > 0) {
        const sortedReleases = filteredReleases.sort((a, b) =>
          new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || a.created_at).getTime()
        );
        const firstRelease = sortedReleases[0];
        const lastRelease = sortedReleases[sortedReleases.length - 1];
        console.log(`First evaluated release: ${firstRelease.published_at || firstRelease.created_at}`);
        console.log(`Last evaluated release: ${lastRelease.published_at || lastRelease.created_at}`);
      }

      return filteredReleases;
    } catch (e: any) {
      console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }
}
