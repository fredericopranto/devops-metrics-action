import * as core from '@actions/core';
export class ReleaseAdapter {
    octokit;
    owner;
    repo;
    constructor(octokit, owner, repo) {
        this.octokit = octokit;
        this.owner = owner;
        this.repo = repo;
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
                const response = await this.octokit.request('GET /repos/{owner}/{repo}/releases', params);
                const nextPage = response.data;
                result = result.concat(nextPage);
                if (nextPage.length < params.per_page) {
                    break;
                }
                page++;
            }
            const filteredReleases = result.filter(release => {
                const publishedAt = new Date(release.published_at || release.created_at);
                if (release.prerelease)
                    return false;
                if (since && publishedAt < since)
                    return false;
                if (until && publishedAt > until)
                    return false;
                return true;
            });
            //console.log('Rate Limit:', await this.octokit.request('GET /rate_limit'))
            if (filteredReleases.length > 0) {
                const sortedReleases = filteredReleases.sort((a, b) => new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || a.created_at).getTime());
                const firstRelease = sortedReleases[0];
                const lastRelease = sortedReleases[sortedReleases.length - 1];
                console.log(`First evaluated release: ${firstRelease.published_at || firstRelease.created_at}`);
                console.log(`Last evaluated release: ${lastRelease.published_at || lastRelease.created_at}`);
            }
            return filteredReleases;
        }
        catch (e) {
            console.error(`Error fetching releases for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
}
//# sourceMappingURL=ReleaseAdapter.js.map