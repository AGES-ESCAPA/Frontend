import { BarList, DonutChart, Panel, SumCard } from '@components/ui';
import type { BarListItem, DonutChartSegment } from '@components/ui';
import type { PopularCourseLeaderView, PopularCoursesSectionProps } from '@/types/adminMetrics';
import styles from './PopularCoursesSection.module.css';

const MAX_RANKED_COURSES = 5;

const formatEnrollmentsDescription = (leader: PopularCourseLeaderView | null): string => {
  if (!leader) {
    return 'Nenhuma matrícula registrada';
  }

  if (leader.enrollmentsLabel && leader.enrollmentsLabel.trim() !== '') {
    return leader.enrollmentsLabel;
  }

  const count =
    typeof leader.enrollments === 'number' && Number.isFinite(leader.enrollments)
      ? Math.max(0, Math.trunc(leader.enrollments))
      : 0;
  const formattedCount = count.toLocaleString('pt-BR');

  return count === 1 ? `${formattedCount} matrícula` : `${formattedCount} matrículas`;
};

export const PopularCoursesSection = ({
  mostAccessedCourse,
  topCourses,
  categoriesCount,
  enrollmentsByCategory,
  className = '',
}: PopularCoursesSectionProps) => {
  const safeCategoriesCount =
    Number.isFinite(categoriesCount) && categoriesCount >= 0 ? Math.trunc(categoriesCount) : 0;

  const rankingItems: BarListItem[] = topCourses.slice(0, MAX_RANKED_COURSES).map((course) => ({
    id: course.courseId,
    label: course.title,
    value: course.enrollments,
  }));

  const distributionSegments: DonutChartSegment[] = enrollmentsByCategory.map((item) => ({
    label: item.category,
    value: item.percentage,
  }));

  return (
    <section
      className={`${styles.section} ${className}`.trim()}
      aria-label="Indicadores de cursos mais populares"
    >
      <div className={styles.kpiGrid}>
        <SumCard
          label="Curso Mais Acessado"
          value={mostAccessedCourse ? mostAccessedCourse.title : '—'}
          description={formatEnrollmentsDescription(mostAccessedCourse)}
          className={styles.leaderCard}
        />
      </div>

      <div className={styles.chartsGrid}>
        <Panel title="Distribuição por Tipo de Curso" className={styles.panel}>
          <DonutChart
            variant="distribution"
            segments={distributionSegments}
            centerValue={safeCategoriesCount}
            centerLabel={safeCategoriesCount === 1 ? 'Categoria' : 'Categorias'}
            showLegend
            ariaLabel="Distribuição por tipo de curso"
          />
        </Panel>

        <Panel title="Top 5 Cursos por Acesso" className={styles.panel}>
          <BarList
            ranked
            items={rankingItems}
            emptyMessage="Nenhum curso com matrículas registradas."
            aria-label="Top 5 cursos por matrículas"
          />
        </Panel>
      </div>
    </section>
  );
};
