export class ChangeFailureRate {
    today;
    issues;
    releases;
    repos;
    constructor(issues, releases, today = null) {
        this.today = today === null ? new Date() : today;
        this.issues = issues;
        this.releases = releases.sort((a, b) => +new Date(a.published_at) < +new Date(b.published_at) ? -1 : 1);
        this.repos = [];
    }
    getBugs() {
        const bugs = [];
        for (const issue of this.issues) {
            if (issue.labels.filter(label => label.name === 'bug').length > 0) {
                bugs.push(issue);
            }
        }
        return bugs;
    }
    Cfr() {
        if (this.issues.length === 0 || this.releases.length === 0) {
            return 0;
        }
        const bugs = this.getBugs();
        // Identificar repositórios únicos a partir das issues
        for (const bug of bugs) {
            const repo = bug.repository_url.split('/').reverse()[0];
            if (!this.repos.includes(repo)) {
                this.repos.push(repo);
            }
        }
        // Mapear releases com suas datas de publicação
        const releaseDates = this.releases.map(release => ({
            published: +new Date(release.published_at),
            url: release.url,
        }));
        let failedDeploys = 0;
        // Iterar sobre cada repositório
        for (const repo of this.repos) {
            const releasesForRepo = releaseDates.filter(r => r.url.includes(repo));
            // Verificar bugs entre releases consecutivas
            for (let i = 0; i < releasesForRepo.length - 1; i++) {
                const bugsInRange = bugs.filter(bug => {
                    if (bug.repository_url.split('/').reverse()[0] !== repo) {
                        return false;
                    }
                    const bugDate = +new Date(bug.created_at);
                    return (bugDate > releasesForRepo[i].published &&
                        bugDate < releasesForRepo[i + 1].published);
                });
                if (bugsInRange.length > 0) {
                    failedDeploys += 1;
                }
            }
        }
        // Calcular a taxa de falha de mudança
        return Math.round((failedDeploys / this.releases.length) * 100);
    }
}
//# sourceMappingURL=ChangeFailureRate.js.map