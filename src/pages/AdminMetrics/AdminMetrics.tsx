import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import { Button, DonutChart, LineChart, Panel, SumCard } from '@components/ui';
import { useAdminMetricsOverview } from '@hooks/useAdminMetricsOverview';
import {
  formatAdminMetricsCompletionRate,
  formatAdminMetricsCount,
  mapAdminMetricsMonthlySeries,
} from '@utils/adminMetrics';
import styles from './AdminMetrics.module.css';

const ADMIN_USER = { name: 'Admin', role: 'Administrador' };
const MENU_ITEMS = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
  ...item,
  active: item.route === '/admin/metricas',
}));
const CHART_HEIGHT = 240;

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
  const { status, data, errorMessage, reload } = useAdminMetricsOverview();

  return (
    <AuthenticatedLayout role="admin" items={MENU_ITEMS} user={ADMIN_USER}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Relatórios Gerais &amp; Métricas</h1>
          <p className={styles.description}>Visão geral de alunos e empresas parceiras.</p>
        </header>

        {status === 'error' ? (
          <div className={styles.errorState}>
            <p className={styles.description} role="alert">
              {errorMessage}
            </p>
            <Button
              className={styles.retryButton}
              type="button"
              variant="primary"
              label="Tentar novamente"
              onClick={reload}
            />
          </div>
        ) : null}

        {/* A grade permite acrescentar os indicadores da US-37 na mesma página. */}
        <div className={styles.summaryGrid}>
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
          />
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
                    segments={[{ label: 'Conclusão média', value: data.averageCompletionRate }]}
                    max={100}
                    centerValue={formatAdminMetricsCompletionRate(data.averageCompletionRate)}
                    centerLabel=""
                    ariaLabel="Taxa média de conclusão"
                    size="compact"
                  />
                ) : (
                  <p className={styles.description}>Indicador indisponível.</p>
                )}
              </div>
            </Panel>
          </section>
        </div>

        <section aria-label="Evolução de Alunos Ativos" id="evolucao">
          <Panel className={styles.chartPanel} title="Evolução de Alunos Ativos">
            <p className={styles.description}>Últimos seis meses</p>
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
                <p className={styles.description}>Indicador indisponível.</p>
              )}
            </div>
          </Panel>
        </section>
      </div>
    </AuthenticatedLayout>
  );
};
