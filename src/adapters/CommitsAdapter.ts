/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import { Commit } from '../types/Commit.js';
import { ICommitsAdapter } from '../interfaces/ICommitsAdapter.js';
import { Logger } from '../utils/Logger.js';
import { exit } from 'process';

export class CommitsAdapter implements ICommitsAdapter {
  octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async getCommitsFromUrl(url: string): Promise<Commit[]> {
    try {
      const response = await this.octokit.request(`GET ${url}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching commits from URL "${url}": ${error}`);
      exit(1);
    }
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      Logger.info(`Fetching default branch for ${owner}/${repo}`);
      const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
      });
      return response.data.default_branch;
    } catch (error: any) {
      Logger.warn(`Failed to fetch default branch for ${owner}/${repo}. Falling back to 'main'. Error: ${error.message}`);
      return 'main';
    }
  }
}