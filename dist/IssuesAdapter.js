import * as core from '@actions/core';
import https from 'https'; // Importa o módulo HTTPS para configurar o agente
export class IssuesAdapter {
    octokit;
    owner;
    repo;
    constructor(octokit, owner, repo) {
        this.octokit = octokit;
        this.owner = owner;
        this.repo = repo;
    }
    async GetAllIssues(since) {
        try {
            let result = [];
            let page = 1;
            let nextPage = [];
            do {
                console.log(`>>>>>>>> Fetching issues from page ${page}`);
                nextPage = await this.getIssues(page, since);
                result = result.concat(nextPage);
                page++;
            } while (nextPage.length === 50);
            return result;
        }
        catch (e) {
            console.error(`Error fetching issues for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
    async getIssues(page, since) {
        const params = {
            owner: this.owner,
            repo: this.repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
            per_page: 50,
            page,
            state: 'all',
        };
        if (since) {
            params.since = since.toISOString();
        }
        const agent = new https.Agent({
            rejectUnauthorized: false,
        });
        console.log(`Fetching issues with params:`, params);
        let result;
        try {
            result = await this.octokit.request('GET /repos/{owner}/{repo}/issues', {
                ...params,
                request: {
                    agent,
                },
            });
        }
        catch (error) {
            if (error.status === 401) {
                console.error(`Authentication failed: ${error.message}`);
                throw new Error('Access denied: Invalid or insufficient permissions for the provided token.');
            }
            console.error(`####### Error fetching issues from GitHub API: ${error.message}`);
            throw error;
        }
        if (!Array.isArray(result.data)) {
            throw new Error(`Unexpected API response: ${JSON.stringify(result.data)}`);
        }
        console.log(`Fetched ${result.data.length} issues from page ${page}`);
        const issues = result.data.filter((issue) => !issue.pull_request);
        return issues;
    }
}
//# sourceMappingURL=IssuesAdapter.js.map