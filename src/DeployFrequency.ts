import { Release } from './types/Release.js';

const ONE_DAY = 1000 * 60 * 60 * 24;

export class DeployFrequency {
  rList: Release[] = new Array<Release>();
  startDate: Date;
  endDate: Date;

  constructor(releases: Release[] | null, startDate: Date | undefined, endDate: Date | undefined) {
    this.rList = releases as Release[];
    this.startDate = startDate ?? (this.rList.length > 0 ? new Date(this.rList[0].published_at) : new Date(0));
    this.endDate = endDate ?? new Date();

    if (this.rList === null || this.rList.length === 0) {
      console.log('Empty release list');
    }
    if (this.startDate > this.endDate) {
      console.log('Start date must be before end date');
    }
  }

  rate(): number | null {
    if (this.rList.length < 2) {
      return null;
    }
      const totalReleases = this.rList.filter(release => {
      const relDate = new Date(release.published_at);

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

  private getTotalDays(): number {
    const startDateWithoutTime = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
    const endDateWithoutTime = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());

    const differenceMs = endDateWithoutTime.getTime() - startDateWithoutTime.getTime();
    return Math.floor(differenceMs / ONE_DAY) + 1;
  }
}
