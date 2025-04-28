export class CommitsAdapter {
    octokit;
    constructor(octokit) {
        this.octokit = octokit;
    }
    async getCommitsFromUrl(url) {
        try {
            const response = await this.octokit.request(`GET ${url}`);
            return response.data;
        }
        catch (error) {
            //console.error(`Error fetching commits from URL "${url}": ${error}`);
            return []; // Retorna uma lista vazia em caso de erro
        }
    }
    async getDefaultBranch(owner, repo) {
        try {
            const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
                owner,
                repo,
            });
            return response.data.default_branch;
        }
        catch (error) {
            console.error(`Error fetching default branch for ${owner}/${repo}:`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=CommitsAdapter.js.map