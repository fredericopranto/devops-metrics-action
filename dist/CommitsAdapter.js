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