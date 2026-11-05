export interface PopularCourseLeaderView {
  courseId?: string;
  title: string;
  /** Quantidade total de matrículas do curso líder. */
  enrollments?: number;
  /**
   * Linha de apoio já formatada exibida abaixo do título do curso
   * (ex.: "Mais de 4,8 mil matrículas" ou "4.820 matrículas").
   * Quando omitida, o componente formata `enrollments` automaticamente.
   */
  enrollmentsLabel?: string;
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
  className?: string;
}
