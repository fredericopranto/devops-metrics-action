/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import { Commit } from '../types/Commit.js';
import { ICommitsAdapter } from '../interfaces/ICommitsAdapter.js';

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
      //console.error(`Error fetching commits from URL "${url}": ${error}`);
      return []; // Retorna uma lista vazia em caso de erro
    }
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
      });

      return response.data.default_branch;
    } catch (error) {
      console.error(`Error fetching default branch for ${owner}/${repo}:`, error);
      throw error;
    }
  }
}
