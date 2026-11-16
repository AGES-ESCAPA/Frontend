import type { ReactNode } from 'react';
import type { LoadStatus } from '@hooks/usePublicCourses';

export interface AdminCourseRankingItem {
  courseId: string;
  title: string;
  /** Quantidade total de matrículas elegíveis do curso. */
  enrollments: number;
}

export interface AdminCategoryEnrollmentShare {
  category: string;
  percentage: number;
}

export interface AdminCourseMetrics {
  /** Curso com maior número de matrículas exibido no card "Curso Mais Acessado". */
  mostAccessedCourse: AdminCourseRankingItem | null;
  /** Lista ordenada de até cinco cursos com maior número de matrículas. */
  topCourses: AdminCourseRankingItem[];
  /** Quantidade total de categorias exibida no centro do gráfico de rosca. */
  categoriesCount: number;
  /** Distribuição percentual de matrículas por categoria de curso. */
  enrollmentsByCategory: AdminCategoryEnrollmentShare[];
}

export interface PopularCoursesSectionProps extends AdminCourseMetrics {
  /** Estado do carregamento dos indicadores de cursos (`'loading' | 'success' | 'error'`). */
  status?: LoadStatus;
  /** Mensagem de falha exibida quando `status === 'error'`. */
  errorMessage?: string | null;
  /** Ação de nova tentativa disparada pelo botão "Tentar novamente". */
  onRetry?: () => void;
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

export interface AdminEngagedCompany {
  companyId: string;
  name: string;
  /** Matrículas elegíveis dos colaboradores vinculados à empresa. */
  enrollments: number;
}

export interface AdminMetricsOverview {
  activeStudents: number;
  partnerCompanies: number;
  /** Percentual de 0 a 100: 68 representa 68%. */
  averageCompletionRate: number;
  activeStudentsByMonth: AdminMetricsMonthlyActiveStudents[];
  /**
   * Variação percentual contra o último dia do mês anterior.
   * Pode ser negativa ou maior que 100; 0 quando não havia base.
   */
  activeStudentsChange: number;
  /**
   * Variação percentual das empresas ativas criadas neste mês.
   * Pode ser negativa ou maior que 100; 0 quando não havia base.
   */
  partnerCompaniesChange: number;
  /** Até cinco empresas ativas, da mais engajada para a menos. */
  topEngagedCompanies: AdminEngagedCompany[];
}
