import * as core from '@actions/core';
export class IssuesAdapter {
    octokit;
    owner;
    repositories;
    today;
    constructor(octokit, owner, repositories) {
        this.octokit = octokit;
        this.owner = owner;
        this.repositories = repositories;
        this.today = new Date();
    }
    async GetAllIssues(since) {
        // console.log(
        //   `Fetching issues ${
        //     since ? `since: ${since.toISOString()}` : 'for all time'
        //   }`
        // );
        try {
            let result = [];
            for (const repo of this.repositories) {
                let nextPage = await this.getIssues(repo, since, 1);
                console.log(`Fetched ${nextPage.length} issues from page 1`);
                result = result.concat(nextPage);
                for (let page = 2; page < 100 && nextPage.length === 100; page++) {
                    nextPage = await this.getIssues(repo, since, page);
                    console.log(`Fetched ${nextPage.length} issues from page ${page}`);
                    result = result.concat(nextPage);
                }
            }
            console.log(`Total issues fetched: ${result.length}`);
            return result;
        }
        catch (e) {
            console.error(`Error fetching issues: ${e.message}`);
            core.setFailed(e.message);
        }
    }
    async getIssues(repo, since, page) {
        const params = {
            owner: this.owner,
            repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
            per_page: 100,
            page,
            state: 'all', // Inclui issues abertas e fechadas
        };
        if (since) {
            params.since = since.toISOString();
        }
        const result = await this.octokit.request('GET /repos/{owner}/{repo}/issues', params);
        //console.log('Rate limit remaining:', result.headers['x-ratelimit-remaining']);
        // Filtrar apenas issues (excluindo pull requests)
        const issues = result.data.filter((issue) => !issue.pull_request);
        //console.log(
        //  `Fetched ${issues.length} issues for repo: ${repo}, page: ${page}`
        //);
        return issues;
    }
}
//# sourceMappingURL=IssuesAdapter.js.map