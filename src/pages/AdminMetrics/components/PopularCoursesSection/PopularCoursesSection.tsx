import { BarList, Button, DonutChart, Panel, SumCard } from '@components/ui';
import type { BarListItem, DonutChartSegment } from '@components/ui';
import { formatMostAccessedCourseSubtitle } from '@utils/formatters';
import type { PopularCoursesSectionProps } from '@/types/adminMetrics';
import styles from './PopularCoursesSection.module.css';

const DEFAULT_ERROR_MESSAGE = 'Não foi possível carregar as métricas de cursos.';
const UNAVAILABLE_MESSAGE = 'Indicador indisponível.';
const EMPTY_LEADER_MESSAGE = 'Nenhuma matrícula registrada';
const EMPTY_DISTRIBUTION_MESSAGE = 'Nenhuma matrícula registrada por categoria.';
const EMPTY_RANKING_MESSAGE = 'Nenhum curso com matrículas registradas.';

interface CourseMetricSkeletonProps {
  label: string;
  variant: 'card' | 'donut' | 'list';
}

const CourseMetricSkeleton = ({ label, variant }: CourseMetricSkeletonProps) => (
  <div role="status" aria-label={label} aria-busy="true">
    <div aria-hidden="true" className={`${styles.skeleton} ${styles[`${variant}Skeleton`]}`} />
  </div>
);

export const PopularCoursesSection = ({
  mostAccessedCourse,
  topCourses,
  categoriesCount,
  enrollmentsByCategory,
  status = 'success',
  errorMessage = null,
  onRetry,
  kpiLeadingCards,
  kpiTrailingCards,
  middlePanel,
  bottomPanel,
  className = '',
}: PopularCoursesSectionProps) => {
  const safeCategoriesCount =
    Number.isFinite(categoriesCount) && categoriesCount >= 0 ? Math.trunc(categoriesCount) : 0;

  const rankingItems: BarListItem[] = topCourses.map((course) => ({
    id: course.courseId,
    label: course.title,
    value: course.enrollments,
  }));

  const distributionSegments: DonutChartSegment[] = enrollmentsByCategory.map((item) => ({
    label: item.category,
    value: item.percentage,
  }));

  const hasDistributionData = safeCategoriesCount > 0 && distributionSegments.length > 0;
  const hasMiddlePanel = Boolean(middlePanel);

  return (
    <section
      className={`${styles.section} ${className}`.trim()}
      aria-label="Indicadores de cursos mais populares"
    >
      {status === 'error' ? (
        <div className={styles.errorBanner}>
          <p className={styles.errorMessage} role="alert">
            {errorMessage ?? DEFAULT_ERROR_MESSAGE}
          </p>
          {onRetry ? (
            <Button
              type="button"
              variant="primary"
              label="Tentar novamente"
              onClick={onRetry}
              className={styles.retryButton}
            />
          ) : null}
        </div>
      ) : null}

      <div className={styles.kpiGrid}>
        {kpiLeadingCards}
        <SumCard
          label="Curso Mais Acessado"
          value={
            status === 'loading' ? (
              <CourseMetricSkeleton label="Carregando curso mais acessado" variant="card" />
            ) : status === 'error' ? (
              '—'
            ) : mostAccessedCourse ? (
              mostAccessedCourse.title
            ) : (
              '—'
            )
          }
          description={
            status === 'loading'
              ? undefined
              : status === 'error'
                ? UNAVAILABLE_MESSAGE
                : mostAccessedCourse
                  ? formatMostAccessedCourseSubtitle(mostAccessedCourse.enrollments)
                  : EMPTY_LEADER_MESSAGE
          }
          className={styles.leaderCard}
        />
        {kpiTrailingCards}
      </div>

      <div
        className={`${styles.chartsGrid} ${hasMiddlePanel ? styles.chartsGridThreeCols : ''}`.trim()}
      >
        <Panel title="Distribuição por Tipo de Curso" className={styles.panel}>
          {status === 'loading' ? (
            <CourseMetricSkeleton
              label="Carregando distribuição por tipo de curso"
              variant="donut"
            />
          ) : status === 'error' ? (
            <p className={styles.emptyMessage}>{UNAVAILABLE_MESSAGE}</p>
          ) : hasDistributionData ? (
            <DonutChart
              variant="distribution"
              segments={distributionSegments}
              centerValue={safeCategoriesCount}
              centerLabel={safeCategoriesCount === 1 ? 'Categoria' : 'Categorias'}
              showLegend
              ariaLabel="Distribuição por tipo de curso"
              className={styles.distributionChart}
            />
          ) : (
            <p className={styles.emptyMessage}>{EMPTY_DISTRIBUTION_MESSAGE}</p>
          )}
        </Panel>

        {middlePanel}

        <Panel title="Top 5 Cursos por Acesso" className={styles.panel}>
          {status === 'loading' ? (
            <CourseMetricSkeleton label="Carregando ranking de cursos" variant="list" />
          ) : status === 'error' ? (
            <p className={styles.emptyMessage}>{UNAVAILABLE_MESSAGE}</p>
          ) : (
            <BarList
              ranked
              items={rankingItems}
              emptyMessage={EMPTY_RANKING_MESSAGE}
              aria-label="Top 5 cursos por matrículas"
              className={styles.rankingList}
            />
          )}
        </Panel>
      </div>

      {bottomPanel}
    </section>
  );
};
