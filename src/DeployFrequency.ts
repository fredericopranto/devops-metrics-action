//

import { Release } from './types/Release.js';

// O número de milissegundos em um dia
const ONE_DAY = 1000 * 60 * 60 * 24;

export class DeployFrequency {
  log: string[] = [];
  today: Date = new Date();
  rList: Release[] = new Array<Release>();

  constructor(releases: Release[] | null, dateString: string | null = null) {
    this.rList = releases as Release[];
    if (this.rList === null || this.rList.length === 0) {
      throw new Error('Empty release list');
    }

    if (dateString !== null) {
      this.today = new Date(dateString);
    }
  }

  getLog(): string[] {
    return this.log;
  }

  weekly(): number {
    let releaseCount = 0;
    for (const release of this.rList) {
      const relDate = new Date(release.published_at);
      if (this.days_between(this.today, relDate) < 8) {
        this.log.push(`release->  ${release.name}:${release.published_at}`);
        releaseCount++;
      }
    }

    return releaseCount;
  }

  monthly(): number {
    let releaseCount = 0;
    for (const release of this.rList) {
      const relDate = new Date(release.published_at);
      if (this.days_between(this.today, relDate) < 31) {
        this.log.push(`release->  ${release.name}:${release.published_at}`);
        releaseCount++;
      }
    }

    return releaseCount;
  }

  rate(): string {
    const average = this.monthlyAverage(); // Usar a média mensal
    return average.toFixed(2); // Retorna a média com 2 casas decimais
  }

  // Agrupar releases por mês e calcular a média
  monthlyAverage(): number {
    const releasesByMonth: Record<string, Release[]> = {};

    // Agrupar releases por mês/ano
    for (const release of this.rList) {
      const relDate = new Date(release.published_at);
      const monthKey = `${relDate.getFullYear()}-${relDate.getMonth() + 1}`; // Ex: "2025-4"
      if (!releasesByMonth[monthKey]) {
        releasesByMonth[monthKey] = [];
      }
      releasesByMonth[monthKey].push(release);
    }

    // Calcular o número de releases por mês
    const monthlyCounts = Object.values(releasesByMonth).map(
      (releases) => releases.length
    );

    // Calcular a média
    const totalReleases = monthlyCounts.reduce((sum, count) => sum + count, 0);
    const average = totalReleases / monthlyCounts.length;

    // Logar os resultados
    for (const [month, releases] of Object.entries(releasesByMonth)) {
        //this.log.push(`Month: ${month}, Releases: ${releases.length}`);
    }

    return parseFloat(average.toFixed(2)); // Retorna a média com 2 casas decimais
  }

  // Calcular a diferença em dias entre duas datas
  private days_between(date1: Date, date2: Date): number {
    const differenceMs = Math.abs(date1.valueOf() - date2.valueOf());
    return Math.round(differenceMs / ONE_DAY);
  }
}
