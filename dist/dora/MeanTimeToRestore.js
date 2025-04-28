const ONE_DAY = 1000 * 60 * 60 * 24;
export class MeanTimeToRestore {
    issues;
    releases;
    releaseDates;
    constructor(issues, releases) {
        this.issues = issues;
        this.releases = releases;
        this.releaseDates = this.releases
            .map(function (r) {
            return { published: +new Date(r.published_at || r.created_at), url: r.url };
        })
            .sort((a, b) => a.published - b.published);
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
            if (!bug.closed_at) {
                continue;
            }
            if (!this.hasLaterRelease(closedAt)) {
                continue;
            }
            if (!this.hasPreviousRelease(createdAt)) {
                continue;
            }
            values.push({
                start: createdAt,
                end: closedAt
            });
        }
        return values;
    }
    getIssuesTaggedAsBug() {
        const bugs = [];
        for (const issue of this.issues) {
            if (issue.labels.filter(label => label.name === 'bug').length > 0) {
                bugs.push(issue);
            }
        }
        return bugs;
    }
    hasPreviousRelease(date) {
        return (this.releaseDates.filter(r => r.published < date)
            .length > 0);
    }
    getReleaseBefore(date) {
        const rdates = this.releaseDates.filter(r => r.published < date);
        if (rdates.length === 0) {
            throw new Error('No previous releases');
        }
        return rdates.pop();
    }
    getReleaseAfter(date) {
        const rdates = this.releaseDates.filter(r => r.published > date);
        if (rdates.length === 0) {
            throw new Error('No later releases');
        }
        return rdates.reverse().pop();
    }
    hasLaterRelease(date) {
        return (this.releaseDates.filter(r => r.published > date)
            .length > 0);
    }
    getRestoreTime(bug) {
        const prevRel = this.getReleaseBefore(bug.start);
        const nextRel = this.getReleaseAfter(bug.end);
        return nextRel.published - prevRel.published;
    }
    mttr() {
        if (this.releases === null || this.releases.length === 0) {
            return null;
        }
        const ttr = this.getBugCount().map(bug => {
            return this.getRestoreTime(bug);
        });
        if (ttr.length === 0) {
            return 0;
        }
        let sum = 0;
        for (const ttrElement of ttr) {
            sum += ttrElement;
        }
        const mttr = Math.round((sum / ttr.length / ONE_DAY) * 100) / 100;
        return mttr;
    }
}
//# sourceMappingURL=MeanTimeToRestore.js.map