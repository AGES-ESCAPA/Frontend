import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import { BarList, DonutChart, LineChart, PageHeader, Panel, SumCard } from '@components/ui';
import { useAdminCourseMetrics } from '@hooks/useAdminCourseMetrics';
import { useAdminMetricsOverview } from '@hooks/useAdminMetricsOverview';
import {
  formatAdminMetricsCompletionRate,
  formatAdminMetricsCount,
  mapAdminMetricsMonthlySeries,
  roundAdminMetricsCompletionRate,
} from '@utils/adminMetrics';
import { PopularCoursesSection } from './components/PopularCoursesSection';
import styles from './AdminMetrics.module.css';

const ADMIN_USER = { name: 'Admin', role: 'Administrador' };
const MENU_ITEMS = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
  ...item,
  active: item.route === '/admin/metricas',
}));
const CHART_HEIGHT = 240;
const TREND_LABEL = 'vs mês anterior';

interface MetricSkeletonProps {
  label: string;
  variant: 'count' | 'donut' | 'line';
}

const MetricSkeleton = ({ label, variant }: MetricSkeletonProps) => (
  <div role="status" aria-label={label} aria-busy="true">
    <div aria-hidden="true" className={`${styles.skeleton} ${styles[`${variant}Skeleton`]}`} />
  </div>
);

export const AdminMetrics = () => {
  const { status, data } = useAdminMetricsOverview();
  // Indicadores de cursos (US-37): carregamento, erro e nova tentativa próprios, sem afetar os de cima.
  const courseMetrics = useAdminCourseMetrics();

  const kpiLeadingCards = (
    <>
      <SumCard
        className={styles.summaryCard}
        label="Alunos ativos"
        value={
          status === 'loading' ? (
            <MetricSkeleton label="Carregando alunos ativos" variant="count" />
          ) : status === 'success' ? (
            formatAdminMetricsCount(data.activeStudents)
          ) : (
            '—'
          )
        }
        trend={
          status === 'success'
            ? { value: data.activeStudentsChange, label: TREND_LABEL }
            : undefined
        }
      />
      <SumCard
        className={styles.summaryCard}
        label="Empresas parceiras"
        value={
          status === 'loading' ? (
            <MetricSkeleton label="Carregando empresas parceiras" variant="count" />
          ) : status === 'success' ? (
            formatAdminMetricsCount(data.partnerCompanies)
          ) : (
            '—'
          )
        }
        trend={
          status === 'success'
            ? { value: data.partnerCompaniesChange, label: TREND_LABEL }
            : undefined
        }
      />
    </>
  );

  const kpiTrailingCards = (
    <section className={styles.completionRegion} aria-label="Taxa Média de Conclusão">
      <Panel
        className={`${styles.chartPanel} ${styles.completionPanel}`}
        title="Taxa Média de Conclusão"
      >
        <div className={styles.completionBody}>
          {status === 'loading' ? (
            <MetricSkeleton label="Carregando taxa média de conclusão" variant="donut" />
          ) : status === 'success' ? (
            <DonutChart
              className={styles.completionDonut}
              variant="progress"
              segments={[
                {
                  label: 'Conclusão média',
                  value: roundAdminMetricsCompletionRate(data.averageCompletionRate),
                },
              ]}
              max={100}
              centerValue={formatAdminMetricsCompletionRate(data.averageCompletionRate)}
              centerLabel=""
              ariaLabel="Taxa média de conclusão"
              size="compact"
              innerRadius="70%"
              outerRadius="88%"
            />
          ) : (
            <p className={styles.description}>—</p>
          )}
        </div>
      </Panel>
    </section>
  );

  const middlePanel = (
    <Panel
      title="Top 5 Empresas Mais Engajadas"
      className={`${styles.chartPanel} ${styles.panelTitle}`}
    >
      {status === 'loading' ? (
        <MetricSkeleton label="Carregando empresas mais engajadas" variant="line" />
      ) : status === 'success' ? (
        <BarList
          ranked
          items={data.topEngagedCompanies.map((company) => ({
            id: company.companyId,
            label: company.name,
            value: company.enrollments,
          }))}
          emptyMessage="Nenhuma empresa com matrículas registradas."
          aria-label="Top 5 empresas mais engajadas"
          className={styles.rankingList}
        />
      ) : (
        <p className={styles.description}>—</p>
      )}
    </Panel>
  );

  const bottomPanel = (
    <section aria-label="Evolução de Alunos Ativos" id="evolucao">
      <Panel
        className={`${styles.chartPanel} ${styles.panelTitle}`}
        title="Evolução de Alunos Ativos"
      >
        <p className={styles.periodLabel}>Últimos seis meses</p>
        <div className={styles.evolutionBody}>
          {status === 'loading' ? (
            <MetricSkeleton label="Carregando evolução de alunos ativos" variant="line" />
          ) : status === 'success' ? (
            <LineChart
              data={mapAdminMetricsMonthlySeries(data.activeStudentsByMonth)}
              valueFormatter={formatAdminMetricsCount}
              height={CHART_HEIGHT}
              ariaLabel="Evolução de Alunos Ativos"
              variant="minimal"
              xAxisInterval="preserveStartEnd"
            />
          ) : (
            <p className={styles.description}>—</p>
          )}
        </div>
      </Panel>
    </section>
  );

  return (
    <AuthenticatedLayout role="admin" items={MENU_ITEMS} user={ADMIN_USER}>
      <div className={styles.page}>
        <PageHeader
          eyebrow="Painel administrativo • Métricas"
          title="Relatórios Gerais & Métricas"
          subtitle="Visão geral de alunos e empresas parceiras."
        />

        <PopularCoursesSection
          status={courseMetrics.status}
          errorMessage={courseMetrics.errorMessage}
          onRetry={courseMetrics.reload}
          mostAccessedCourse={courseMetrics.metrics?.mostAccessedCourse ?? null}
          topCourses={courseMetrics.metrics?.topCourses ?? []}
          categoriesCount={courseMetrics.metrics?.categoriesCount ?? 0}
          enrollmentsByCategory={courseMetrics.metrics?.enrollmentsByCategory ?? []}
          kpiLeadingCards={kpiLeadingCards}
          kpiTrailingCards={kpiTrailingCards}
          middlePanel={middlePanel}
          bottomPanel={bottomPanel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
