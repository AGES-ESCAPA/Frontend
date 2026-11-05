import { useMemo } from 'react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { BarList, DonutChart, Panel } from '@components/ui';
import type { PopularCoursesMetricsData } from '@/types/adminMetrics';
import { PopularCoursesSection } from './components/PopularCoursesSection';
import {
  MOCK_ACTIVE_STUDENTS_EVOLUTION,
  MOCK_COURSE_METRICS,
  MOCK_ENGAGED_COMPANIES,
} from './mockCourseMetrics';
import styles from './AdminMetrics.module.css';

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

const EVOLUTION_POLYLINE_POINTS = MOCK_ACTIVE_STUDENTS_EVOLUTION.map(
  (point) => `${point.x},${point.y}`,
).join(' ');

export interface AdminMetricsProps {
  /** Dados de indicadores de cursos populares já preparados pela camada de integração. */
  courseMetrics?: PopularCoursesMetricsData;
}

export const AdminMetrics = ({ courseMetrics = MOCK_COURSE_METRICS }: AdminMetricsProps) => {
  const menuItems = useMemo(
    () =>
      SIDEBAR_MENU_PRESETS.admin.map((item) => ({
        ...item,
        active: item.route === '/admin/metricas',
      })),
    [],
  );

  const kpiLeadingCards = (
    <>
      <article className={styles.kpiCard} aria-labelledby="kpi-active-students">
        <p id="kpi-active-students" className={styles.kpiLabel}>
          Alunos Ativos
        </p>
        <p className={styles.kpiValue}>12.847</p>
        <p className={styles.kpiTrend}>
          <span className={styles.trendPositive}>↑ 18%</span>
          <span>vs mês anterior</span>
        </p>
      </article>

      <article className={styles.kpiCard} aria-labelledby="kpi-partner-companies">
        <p id="kpi-partner-companies" className={styles.kpiLabel}>
          Empresas Parceiras
        </p>
        <p className={styles.kpiValue}>342</p>
        <p className={styles.kpiTrend}>
          <span className={styles.trendPositive}>↑ 7%</span>
          <span>vs mês anterior</span>
        </p>
      </article>
    </>
  );

  const kpiTrailingCards = (
    <article className={styles.kpiCard} aria-labelledby="kpi-completion-rate">
      <p id="kpi-completion-rate" className={styles.kpiLabel}>
        Taxa Média de Conclusão
      </p>
      <div className={styles.completionWrap}>
        <DonutChart
          variant="progress"
          segments={[{ label: 'Conclusões', value: 68 }]}
          max={100}
          centerValue="68%"
          centerLabel=""
          ariaLabel="Taxa média de conclusão"
          className={styles.completionDonut}
        />
      </div>
    </article>
  );

  const middlePanel = (
    <Panel title="Top 5 Empresas Mais Engajadas" className={styles.panel}>
      <BarList
        ranked
        items={MOCK_ENGAGED_COMPANIES}
        aria-label="Top 5 empresas mais engajadas"
        className={styles.rankingList}
      />
    </Panel>
  );

  const bottomPanel = (
    <Panel title="Evolução de Alunos Ativos" className={styles.panel}>
      <div className={styles.evolutionChartWrap}>
        <svg
          className={styles.evolutionSvg}
          viewBox="0 0 1000 165"
          role="img"
          aria-label="Evolução de alunos ativos de março a agosto de 2026"
        >
          {[20, 52, 84, 116, 148].map((y) => (
            <line
              key={y}
              x1="16"
              y1={y}
              x2="984"
              y2={y}
              className={styles.gridLine}
              strokeDasharray="4 4"
            />
          ))}

          <polyline
            fill="none"
            points={`${EVOLUTION_POLYLINE_POINTS} 976,22`}
            className={styles.evolutionLine}
          />

          {MOCK_ACTIVE_STUDENTS_EVOLUTION.map((point) => (
            <circle
              key={point.month}
              cx={point.x}
              cy={point.y}
              r="3.5"
              className={styles.evolutionDot}
            />
          ))}
        </svg>

        <div className={styles.evolutionAxis} aria-hidden="true">
          {MOCK_ACTIVE_STUDENTS_EVOLUTION.map((point) => (
            <span key={point.month}>{point.month}</span>
          ))}
        </div>
      </div>
    </Panel>
  );

  return (
    <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER}>
      <div className={styles.page}>
        <PopularCoursesSection
          mostAccessedCourse={courseMetrics.mostAccessedCourse}
          topCourses={courseMetrics.topCourses}
          categoriesCount={courseMetrics.categoriesCount}
          enrollmentsByCategory={courseMetrics.enrollmentsByCategory}
          kpiLeadingCards={kpiLeadingCards}
          kpiTrailingCards={kpiTrailingCards}
          middlePanel={middlePanel}
          bottomPanel={bottomPanel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
