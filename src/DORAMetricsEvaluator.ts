export class DORAMetricsEvaluator {
  /**
   * Avalia a métrica de Deployment Frequency (DF) e retorna a classificação.
   * @param df Deployment Frequency (em dias entre deploys).
   * @returns Classificação: "Elite", "Alta", "Média" ou "Baixa".
   */
  static evaluateDeploymentFrequency(df: number | null): string {
    if (df === null) {
      return 'Indefinido';
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

  /**
   * Avalia a métrica de Lead Time para mudanças e retorna a classificação.
   * @param leadTime Lead Time (em dias).
   * @returns Classificação: "Elite", "Alta", "Média" ou "Baixa".
   */
  static evaluateLeadTime(leadTime: number | null): string {
    if (leadTime === null) {
      return 'Indefinido';
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

  /**
   * Avalia a métrica de Taxa de Falhas em Mudanças e retorna a classificação.
   * @param failureRate Taxa de falhas (em %).
   * @returns Classificação: "Elite", "Alta", "Média" ou "Baixa".
   */
  static evaluateChangeFailureRate(failureRate: number | null): string {
    if (failureRate === null) {
      return 'Indefinido';
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

  /**
   * Avalia a métrica de Tempo Médio para Recuperação (MTTR) e retorna a classificação.
   * @param mttr Tempo médio para recuperação (em horas).
   * @returns Classificação: "Elite", "Alta", "Média" ou "Baixa".
   */
  static evaluateMTTR(mttr: number | null): string {
    if (mttr === null) {
      return 'Indefinido';
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