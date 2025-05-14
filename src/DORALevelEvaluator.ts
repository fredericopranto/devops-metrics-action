export class DORAMetricsEvaluator {
  static evaluateDeploymentFrequency(df: number | null): string {
    if (df === null) {
      return 'null';
    }

    if (df <= 1) {
      return 'Elite'; // Sob demanda (várias vezes ao dia)
    } else if (df <= 7) {
      return 'Alta'; // Entre 1 vez por dia e 1 vez por semana
    } else if (df <= 30) {
      return 'Média'; // Entre 1 vez por semana e 1 vez por mês
    } else {
      return 'Baixa'; // Menos que 1 vez por mês
    }
  }

  static evaluateLeadTime(leadTime: number | null): string {
    if (leadTime === null) {
      return 'null';
    }

    if (leadTime < 1) {
      return 'Elite'; // Menos de 1 dia
    } else if (leadTime <= 7) {
      return 'Alta'; // Entre 1 dia e 1 semana
    } else if (leadTime <= 30) {
      return 'Média'; // Entre 1 semana e 1 mês
    } else {
      return 'Baixa'; // Mais de 1 mês
    }
  }

  static evaluateChangeFailureRate(failureRate: number | null): string {
    if (failureRate === null) {
      return 'null';
    }

    if (failureRate <= 15) {
      return 'Elite'; // 0–15%
    } else if (failureRate <= 30) {
      return 'Alta'; // 16–30%
    } else if (failureRate <= 45) {
      return 'Média'; // 31–45%
    } else {
      return 'Baixa'; // Mais de 46%
    }
  }

  static evaluateMTTR(mttr: number | null): string {
    if (mttr === null) {
      return 'null';
    }

    if (mttr < 1) {
      return 'Elite'; // Menos de 1 hora
    } else if (mttr <= 24) {
      return 'Alta'; // Menos de 1 dia
    } else if (mttr <= 168) {
      return 'Média'; // Entre 1 dia e 1 semana
    } else {
      return 'Baixa'; // Mais de 1 semana
    }
  }
}