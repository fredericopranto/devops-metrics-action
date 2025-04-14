import * as core from '@actions/core';
export class ReleaseAdapter {
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
    async GetAllReleasesLastMonth() {
        const since = new Date(this.today.valueOf() - 61 * 24 * 60 * 60 * 1000); // Go two months back
        console.log(`Fetching releases since: ${since.toISOString()}`);
        try {
            let result = [];
            for (const repo of this.repositories) {
                console.log(`Fetching releases for repository: ${repo}`);
                let nextPage = await this.getReleases(repo, since, 1);
                console.log(`Fetched ${nextPage.length} releases from page 1`);
                result = result.concat(nextPage);
                for (let page = 2; page < 100 && nextPage.length === 100; page++) {
                    nextPage = await this.getReleases(repo, since, page);
                    console.log(`Fetched ${nextPage.length} releases from page ${page}`);
                    result = result.concat(nextPage);
                }
            }
            console.log(`Total releases fetched: ${result.length}`);
            return result;
        }
        catch (e) {
            console.error(`Error fetching releases: ${e.message}`);
            core.setFailed(e.message);
        }
    }
    async getReleases(repo, since, page) {
        const result = await this.octokit.request('GET /repos/{owner}/{repo}/releases?state=all&since={since}&per_page={per_page}&page={page}', {
            owner: this.owner,
            repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
            since: since.toISOString(),
            per_page: 100,
            page,
        });
        return Promise.resolve(result.data);
    }
}
//# sourceMappingURL=ReleaseAdapter.js.map