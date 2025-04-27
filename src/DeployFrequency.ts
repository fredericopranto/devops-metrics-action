import { Release } from './types/Release.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

export class DeployFrequency {
  releases: Release[];
  startDate?: Date;
  endDate?: Date;

  constructor(releases: Release[], startDate?: Date | null, endDate?: Date | null) {
    if (startDate && isNaN(new Date(startDate).getTime())) {
      throw new Error('Invalid start date format');
    }

    if (endDate && isNaN(new Date(endDate).getTime())) {
      throw new Error('Invalid end date format');
    }

    this.releases = releases;
    this.releases.forEach(release => {
      const releaseDate = new Date(release.published_at || release.created_at);
      if (isNaN(releaseDate.getTime())) {
        throw new Error(`Invalid release date format: ${release.published_at || release.created_at}`);
      }
    });

    this.startDate = startDate
      ? new Date(startDate.toISOString().split('T')[0])
      : (this.releases.length > 0
          ? new Date(new Date(this.releases[0].published_at || this.releases[0].created_at).toISOString().split('T')[0])
          : new Date(0));
          
    this.endDate = endDate
      ? new Date(endDate.toISOString().split('T')[0])
      : new Date(new Date().toISOString().split('T')[0]);
  }

  rate(): number | null {
    if (this.startDate! > this.endDate!) {
      throw new Error('Start date must be before end date');
    }

    const totalReleases = this.releases.filter(release => {
      const relDate = new Date(release.published_at || release.created_at);
      const relDateWithoutTime = new Date(relDate.toISOString().split('T')[0]);
      const startDateWithoutTime = new Date(this.startDate!.toISOString().split('T')[0]);
      const endDateWithoutTime = new Date(this.endDate!.toISOString().split('T')[0]);

      const isInRange = relDateWithoutTime >= startDateWithoutTime && relDateWithoutTime <= endDateWithoutTime;
      return isInRange;
    }).length;

    if (totalReleases === 0) {
      return null;
    }

    const totalPeriods = this.getTotalDays();

    // console.log(`Total releases: ${totalReleases}`);
    // console.log(`Total periods (days): ${totalPeriods}`);
    // console.log('Start Date:', this.startDate);
    // console.log('End Date:', this.endDate);

    const average = totalPeriods / totalReleases;
    return parseFloat(average.toFixed(2));
  }

  private getTotalDays(): number {
    const startDateWithoutTime = new Date(this.startDate!.toISOString().split('T')[0]);
    const endDateWithoutTime = new Date(this.endDate!.toISOString().split('T')[0]);

    const differenceMs = endDateWithoutTime.getTime() - startDateWithoutTime.getTime();
    return Math.floor(differenceMs / ONE_DAY) + 1;
  }
}
