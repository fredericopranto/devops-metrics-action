const ONE_DAY = 24 * 60 * 60 * 1000;
export class LeadTime {
    log = [];
    pulls;
    releases;
    branch;
    commitsAdapter;
    constructor(pulls, releases, commitsAdapter, branch) {
        this.commitsAdapter = commitsAdapter;
        this.branch = branch;
        this.pulls = pulls;
        this.releases = releases.map((r) => {
            return {
                published: +new Date(r.published_at),
                url: r.url,
                name: r.name,
                published_at: r.published_at,
            };
        });
    }
    async getLeadTime() {
        if (this.pulls.length === 0 || this.releases.length === 0) {
            return null;
        }
        const leadTimes = [];
        let processedCount = 0;
        for (const pull of this.pulls) {
            processedCount++;
            //console.log(`Processing PR ${processedCount}/${this.pulls.length}: ${pull.title}`);
            if (typeof pull.merged_at === 'string' &&
                pull.merged_at &&
                typeof pull.base.repo.name === 'string' &&
                pull.base.repo.name &&
                pull.base.ref === this.branch) {
                const mergeTime = +new Date(pull.merged_at);
                const laterReleases = this.releases.filter((r) => r.published > mergeTime && r.url.includes(pull.base.repo.name));
                if (laterReleases.length === 0) {
                    continue;
                }
                const deployTime = laterReleases[0].published;
                const commits = (await this.commitsAdapter.getCommitsFromUrl(pull.commits_url));
                if (commits.length === 0) {
                    continue;
                }
                const commitTime = commits
                    .map((c) => +new Date(c.commit.committer.date))
                    .sort((a, b) => a - b)[0];
                const leadTime = (deployTime - commitTime) / ONE_DAY;
                leadTimes.push(leadTime);
            }
        }
        if (leadTimes.length === 0) {
            return null;
        }
        const averageLeadTime = Math.round((leadTimes.reduce((p, c) => p + c) / leadTimes.length) * 100) /
            100;
        return averageLeadTime;
    }
}
//# sourceMappingURL=LeadTime.js.map