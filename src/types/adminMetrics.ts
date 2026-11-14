import type { ReactNode } from 'react';

export interface PopularCourseLeaderView {
  courseId: string;
  title: string;
  /** Quantidade total de matrículas do curso líder. */
  enrollments: number;
}

export interface PopularCourseRankItemView {
  courseId: string;
  title: string;
  enrollments: number;
}

export interface CourseCategoryDistributionItemView {
  category: string;
  percentage: number;
}

export interface PopularCoursesMetricsData {
  /** Curso com maior número de matrículas exibido no card "Curso Mais Acessado". */
  mostAccessedCourse: PopularCourseLeaderView | null;
  /** Lista ordenada de até cinco cursos com maior número de matrículas. */
  topCourses: PopularCourseRankItemView[];
  /** Quantidade total de categorias exibida no centro do gráfico de rosca. */
  categoriesCount: number;
  /** Distribuição percentual de matrículas por categoria de curso. */
  enrollmentsByCategory: CourseCategoryDistributionItemView[];
}

export interface PopularCoursesSectionProps extends PopularCoursesMetricsData {
  /** Cards exibidos antes do card "Curso Mais Acessado" na grade superior de KPIs. */
  kpiLeadingCards?: ReactNode;
  /** Cards exibidos após o card "Curso Mais Acessado" na grade superior de KPIs. */
  kpiTrailingCards?: ReactNode;
  /** Painel intermediário exibido entre a distribuição de categorias e o ranking de cursos. */
  middlePanel?: ReactNode;
  /** Painel inferior exibido abaixo da linha de distribuição e rankings. */
  bottomPanel?: ReactNode;
  className?: string;
}

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
