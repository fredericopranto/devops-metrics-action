const ONE_DAY = 1000 * 60 * 60 * 24;
export class DeployFrequency {
    rList = new Array();
    startDate;
    endDate;
    constructor(releases, startDate, endDate) {
        this.rList = releases;
        this.startDate = startDate ?? (this.rList.length > 0 ? new Date(this.rList[0].published_at) : new Date(0));
        this.endDate = endDate ?? new Date();
        if (this.rList === null || this.rList.length === 0) {
            console.log('Empty release list');
        }
        if (this.startDate > this.endDate) {
            console.log('Start date must be before end date');
        }
    }
    rate() {
        if (this.rList.length < 2) {
            console.log('At least two releases are required to calculate the average time between releases.');
        }
        const totalReleases = this.rList.filter(release => {
            const relDate = new Date(release.published_at);
            // Se startDate ou endDate forem nulos, não aplicar o filtro
            if (!this.startDate || !this.endDate) {
                return true;
            }
            const relDateWithoutTime = new Date(relDate.getFullYear(), relDate.getMonth(), relDate.getDate());
            const startDateWithoutTime = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
            const endDateWithoutTime = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());
            const isInRange = relDateWithoutTime >= startDateWithoutTime && relDateWithoutTime <= endDateWithoutTime;
            return isInRange;
        }).length;
        let totalPeriods = 0;
        totalPeriods = this.getTotalDays();
        console.log(`Total releases: ${totalReleases}`);
        console.log(`Total periods (days): ${totalPeriods}`);
        const average = totalPeriods / totalReleases;
        return parseFloat(average.toFixed(2));
    }
    getTotalDays() {
        const startDateWithoutTime = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
        const endDateWithoutTime = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());
        const differenceMs = endDateWithoutTime.getTime() - startDateWithoutTime.getTime();
        return Math.floor(differenceMs / ONE_DAY) + 1;
    }
}
//# sourceMappingURL=DeployFrequency.js.map