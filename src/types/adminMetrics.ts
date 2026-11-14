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

export type PopularCourseLeaderView = AdminCourseRankingItem;
export type PopularCourseRankItemView = AdminCourseRankingItem;
export type CourseCategoryDistributionItemView = AdminCategoryEnrollmentShare;
export type PopularCoursesMetricsData = AdminCourseMetrics;

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
