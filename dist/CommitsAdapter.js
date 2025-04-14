import * as core from '@actions/core';
export class CommitsAdapter {
    octokit;
    constructor(octokit) {
        this.octokit = octokit;
    }
    async getCommitsFromUrl(url) {
        try {
            const result = await this.getCommits(url);
            return result;
        }
        catch (e) {
            core.setFailed(e.message);
        }
    }
    async getCommits(url) {
        const result = await this.octokit.request(url, {
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });
        return Promise.resolve(result.data);
    }
}
//# sourceMappingURL=CommitsAdapter.js.map