/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/core';
import * as core from '@actions/core';
import { Commit } from './types/Commit.js';
import { ICommitsAdapter } from './interfaces/ICommitsAdapter.js';

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

  private async getCommits(url: string): Promise<Commit[] | undefined> {
    const result = await this.octokit.request(url, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    return Promise.resolve(result.data);
  }
}
