import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import type { Release } from '../types/Release.js';
import type { IReleaseAdapter } from '../interfaces/IReleaseAdapter.js';
import { Logger } from '../utils/Logger.js';

export class ReleaseAdapter implements IReleaseAdapter {
  octokit: Octokit;
  owner: string;
  repo: string;

  constructor(octokit: Octokit, owner: string, repo: string) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
  }

  async GetAllReleases(since?: Date | null, until?: Date | null): Promise<Release[]> {
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
          per_page: parseInt(process.env.ISSUES_PER_PAGE || '50'),
          page,
        };

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
        Logger.debug(`Processing Release: ${release.tag_name}, Published At: ${release.published_at || release.created_at}`);
        return true;
      });

      return filteredReleases;
    } catch (e: any) {
      console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
      core.setFailed(e.message);
      return [];
    }
  }
}
