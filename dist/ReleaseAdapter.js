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
                // Construir a URL completa manualmente
                const baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/releases`;
                const queryParams = `?per_page=${params.per_page}&page=${params.page}`;
                const fullUrl = `${baseUrl}${queryParams}`;
                //console.log(`Requesting URL: ${fullUrl}`);
                const response = await this.octokit.request('GET /repos/{owner}/{repo}/releases', params);
                const nextPage = response.data;
                result = result.concat(nextPage);
                if (nextPage.length < params.per_page) {
                    break;
                }
                page++;
            }
            // Filtrar releases no lado do cliente com base nas datas since e until e remover pré-releases
            const filteredReleases = result.filter(release => {
                const publishedAt = new Date(release.published_at || '');
                if (release.prerelease)
                    return false;
                if (since && publishedAt < since)
                    return false;
                if (until && publishedAt > until)
                    return false;
                return true;
            });
            const rateLimit = await this.octokit.request('GET /rate_limit');
            //console.log('Rate Limit:', rateLimit.data.rate);
            // Print the total number of releases evaluated
            console.log(`Total releases evaluated for the repository "${this.repo}": ${filteredReleases.length}`);
            // Print the date/time of the first and last evaluated release
            if (filteredReleases.length > 0) {
                const sortedReleases = filteredReleases.sort((a, b) => new Date(a.published_at || '').getTime() - new Date(b.published_at || '').getTime());
                const firstRelease = sortedReleases[0];
                const lastRelease = sortedReleases[sortedReleases.length - 1];
                console.log(`First evaluated release: ${firstRelease.published_at}`);
                console.log(`Last evaluated release: ${lastRelease.published_at}`);
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