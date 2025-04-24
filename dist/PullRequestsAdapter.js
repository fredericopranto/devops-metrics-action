import * as core from '@actions/core';
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
                nextPage = await this.getPRs(since, page);
                console.log(`Fetched ${nextPage.length} pull requests from page ${page}`);
                result = result.concat(nextPage);
                page++;
            } while (nextPage.length === 50);
            console.log(`Total pull requests fetched for repository "${this.repo}": ${result.length}`);
            return result;
        }
        catch (e) {
            console.error(`Error fetching pull requests for repository "${this.repo}": ${e.message}`);
            core.setFailed(e.message);
            return [];
        }
    }
    async getPRs(since, page) {
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
    async getPullRequestsGraphQL(startDate, endDate) {
        const query = `
      query ($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(
            first: 50,
            after: $cursor,
            states: CLOSED,
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            edges {
              node {
                id
                number
                title
                state
                createdAt
                updatedAt
                closedAt
                mergedAt
                baseRefName
                headRefName
                url
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;
        const variables = {
            owner: this.owner,
            repo: this.repo,
            cursor: null,
        };
        let pullRequests = [];
        let hasNextPage = true;
        while (hasNextPage) {
            const response = await this.octokit.graphql(query, variables);
            const edges = response.repository.pullRequests.edges;
            // Filtrar PRs pelo intervalo de datas
            const filteredPRs = edges
                .map((edge) => edge.node)
                .filter((pr) => {
                const closedAt = new Date(pr.closedAt);
                return (!startDate || closedAt >= startDate) && (!endDate || closedAt <= endDate);
            });
            pullRequests = pullRequests.concat(filteredPRs);
            // Atualizar paginação
            hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
            variables.cursor = response.repository.pullRequests.pageInfo.endCursor;
        }
        return pullRequests;
    }
}
//# sourceMappingURL=PullRequestsAdapter.js.map