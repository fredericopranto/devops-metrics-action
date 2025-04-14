const ONE_DAY = 1000 * 60 * 60 * 24;
export class MeanTimeToRestore {
    today;
    issues;
    releases;
    releaseDates; // array of object with unix time and repo url
    constructor(issues, releases, today = null) {
        if (today === null) {
            this.today = new Date();
        }
        else {
            this.today = today;
        }
        this.issues = issues;
        this.releases = releases;
        if (this.releases === null || this.releases.length === 0) {
            throw new Error('Empty release list');
        }
        this.releaseDates = this.releases
            .map(function (r) {
            return { published: +new Date(r.published_at), url: r.url };
        })
            .sort((a, b) => a.published - b.published); // Sort ascending
    }
    getBugCount() {
        const bugs = this.getIssuesTaggedAsBug();
        const values = this.getStartAndEndTimesForBugs(bugs);
        return values;
    }
    getStartAndEndTimesForBugs(bugs) {
        const values = [];
        for (const bug of bugs) {
            const createdAt = +new Date(bug.created_at);
            const closedAt = +new Date(bug.closed_at);
            const repoName = bug.repository_url.split('/').reverse()[0];
            //console.log(`Processing bug: ${bug.repository_url}`);
            if (!bug.closed_at) {
                //console.log(`Bug ignored (no closed_at): ${bug.repository_url}`);
                continue;
            }
            if (!this.hasLaterRelease(closedAt, repoName)) {
                //console.log(`Bug ignored (no later release): ${bug.repository_url}`);
                continue;
            }
            if (!this.hasPreviousRelease(createdAt, repoName)) {
                //console.log(`Bug ignored (no previous release): ${bug.repository_url}`);
                continue;
            }
            values.push({
                start: createdAt,
                end: closedAt,
                repo: repoName,
            });
        }
        console.log(`Valid bugs for MTTR calculation: ${values.length}`);
        return values;
    }
    getIssuesTaggedAsBug() {
        const bugs = [];
        for (const issue of this.issues) {
            if (issue.labels.filter(label => label.name === 'bug').length > 0) {
                bugs.push(issue);
            }
        }
        console.log(`Total issues: ${this.issues.length}`);
        console.log(`Filtered bugs: ${bugs.length}`);
        return bugs;
    }
    hasPreviousRelease(date, repo) {
        return (this.releaseDates.filter(r => r.published < date && r.url.includes(repo))
            .length > 0);
    }
    getReleaseBefore(date, repo) {
        const rdates = this.releaseDates.filter(r => r.published < date && r.url.includes(repo));
        if (rdates.length === 0) {
            throw new Error('No previous releases');
        }
        return rdates.pop();
    }
    getReleaseAfter(date, repo) {
        const rdates = this.releaseDates.filter(r => r.published > date && r.url.includes(repo));
        if (rdates.length === 0) {
            throw new Error('No later releases');
        }
        return rdates.reverse().pop();
    }
    hasLaterRelease(date, repo) {
        return (this.releaseDates.filter(r => r.published > date && r.url.includes(repo))
            .length > 0);
    }
    getRestoreTime(bug) {
        const prevRel = this.getReleaseBefore(bug.start, bug.repo);
        const nextRel = this.getReleaseAfter(bug.end, bug.repo);
        return nextRel.published - prevRel.published;
    }
    mttr() {
        const ttr = this.getBugCount().map(bug => {
            //console.log(`Calculating TTR for bug: ${bug.repo}`);
            return this.getRestoreTime(bug);
        });
        //console.log(`Total TTR values: ${ttr.length}`);
        if (ttr.length === 0) {
            //console.log('No valid TTR values. MTTR is 0.');
            return 0;
        }
        let sum = 0;
        for (const ttrElement of ttr) {
            sum += ttrElement;
        }
        const mttr = Math.round((sum / ttr.length / ONE_DAY) * 100) / 100;
        console.log(`Mean Time to Restore: ${mttr} days`);
        return mttr;
    }
}
//# sourceMappingURL=MeanTimeToRestore.js.map