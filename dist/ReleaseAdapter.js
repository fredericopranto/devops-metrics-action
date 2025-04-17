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
    async GetAllReleases(since, until) {
        try {
            let result = [];
            let page = 1;
            while (true) {
                const params = {
                    owner: this.owner,
                    repo: this.repo,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                    per_page: 50,
                    page,
                };
                if (since) {
                    params.since = since.toISOString();
                }
                if (until) {
                    params.until = until.toISOString();
                }
                const response = await this.octokit.request('GET /repos/{owner}/{repo}/releases', params);
                const nextPage = response.data;
                result = result.concat(nextPage);
                if (nextPage.length < params.per_page) {
                    break;
                }
                page++;
            }
            const rateLimit = await this.octokit.request('GET /rate_limit');
            console.log('Rate Limit:', rateLimit.data.rate);
            // Print the total number of releases evaluated
            console.log(`Total releases evaluated for the repository "${this.repo}": ${result.length}`);
            // Print the date/time of the first and last evaluated release
            if (result.length > 0) {
                const sortedReleases = result.sort((a, b) => new Date(a.published_at || '').getTime() - new Date(b.published_at || '').getTime());
                const firstRelease = sortedReleases[0];
                const lastRelease = sortedReleases[sortedReleases.length - 1];
                console.log(`First evaluated release: ${firstRelease.published_at}`);
                console.log(`Last evaluated release: ${lastRelease.published_at}`);
            }
            return result;
        }
        catch (e) {
            console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
}
//# sourceMappingURL=ReleaseAdapter.js.map