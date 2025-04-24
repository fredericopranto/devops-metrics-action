import * as core from '@actions/core';
export class PullRequestsAdapter {
    octokit;
    owner;
    repo;
    today;
    constructor(octokit, owner, repo) {
        this.octokit = octokit;
        this.owner = owner;
        this.repo = repo;
        this.today = new Date();
    }
    async GetAllPRs(since) {
        try {
            let result = [];
            let page = 1;
            let nextPage = [];
            do {
                nextPage = await this.getPRs(since, page);
                result = result.concat(nextPage);
                page++;
            } while (nextPage.length === 50);
            return result;
        }
        catch (e) {
            console.error(`Error fetching pull requests for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
    async getPRs(since, page) {
        const params = {
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
        const result = await this.octokit.request('GET /repos/{owner}/{repo}/pulls', params);
        return result.data;
    }
    async getDefaultBranch(owner, repo) {
        try {
            const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
                owner,
                repo,
            });
            return response.data.default_branch;
        }
        catch (error) {
            console.error(`Error fetching default branch for ${owner}/${repo}:`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=PullRequestsAdapter.js.map