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
                nextPage = await this.getPRs(page, since);
                result = result.concat(nextPage);
                page++;
            } while (nextPage.length === 50);
            return result;
        }
        catch (e) {
            console.error(`Error fetching pull requests for repository "${this.repo}": ${e.message}`);
            return [];
        }
    }
    async getPRs(page, since) {
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
}
//# sourceMappingURL=PullRequestsAdapter.js.map