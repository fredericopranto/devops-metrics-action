import * as core from '@actions/core';
export class IssuesAdapter {
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
    async GetAllIssues(since) {
        try {
            let result = [];
            let page = 1;
            let nextPage = [];
            do {
                //console.log(`Fetching issues for repository "${this.repo}", page ${page}...`);
                nextPage = await this.getIssues(since, page);
                //console.log(`Fetched ${nextPage.length} issues from page ${page}`);
                result = result.concat(nextPage);
                page++;
            } while (nextPage.length === 100);
            //console.log(`Total issues fetched for repository "${this.repo}": ${result.length}`);
            return result;
        }
        catch (e) {
            console.error(`Error fetching issues for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
    async getIssues(since, page) {
        const params = {
            owner: this.owner,
            repo: this.repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
            per_page: 100,
            page,
            state: 'all',
        };
        if (since) {
            params.since = since.toISOString();
        }
        const result = await this.octokit.request('GET /repos/{owner}/{repo}/issues', params);
        // Filtrar apenas issues (excluindo pull requests)
        const issues = result.data.filter((issue) => !issue.pull_request);
        //console.log(`Fetched ${issues.length} issues for repo: "${this.repo}", page: ${page}`);
        return issues;
    }
}
//# sourceMappingURL=IssuesAdapter.js.map