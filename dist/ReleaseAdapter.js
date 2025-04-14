import * as core from '@actions/core';
export class ReleaseAdapter {
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
    async GetAllReleases(since) {
        try {
            let result = [];
            let page = 1;
            let nextPage = [];
            do {
                nextPage = await this.getReleases(since, page);
                result = result.concat(nextPage);
                page++;
            } while (nextPage.length === 100); // Continua enquanto houver 100 releases por página
            console.log(`Total releases fetched for repository "${this.repo}": ${result.length}`);
            return result;
        }
        catch (e) {
            console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
    async getReleases(since, page) {
        const params = {
            owner: this.owner,
            repo: this.repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
            per_page: 100,
            page,
        };
        if (since) {
            params.since = since.toISOString();
        }
        const result = await this.octokit.request('GET /repos/{owner}/{repo}/releases', params);
        console.log(`Fetched ${result.data.length} releases from page ${page} for repository "${this.repo}"`);
        return result.data;
    }
}
//# sourceMappingURL=ReleaseAdapter.js.map