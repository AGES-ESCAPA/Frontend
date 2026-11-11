export interface AdminMetricsMonthlyActiveStudents {
  /** Mês-calendário no formato YYYY-MM. */
  month: string;
  activeStudents: number;
}

export interface AdminMetricsOverview {
  activeStudents: number;
  partnerCompanies: number;
  /** Percentual de 0 a 100: 68 representa 68%. */
  averageCompletionRate: number;
  activeStudentsByMonth: AdminMetricsMonthlyActiveStudents[];
}
