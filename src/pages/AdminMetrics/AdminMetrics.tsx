import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import { BarList, DonutChart, Panel, SumCard } from '@components/ui';
import type { PopularCoursesMetricsData } from '@/types/adminMetrics';
import { PopularCoursesSection } from './components/PopularCoursesSection';
import { MOCK_COURSE_METRICS, MOCK_ENGAGED_COMPANIES } from './mockCourseMetrics';
import styles from './AdminMetrics.module.css';

const ADMIN_USER = { name: 'Admin', role: 'Administrador' };
const MENU_ITEMS = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
  ...item,
  active: item.route === '/admin/metricas',
}));
const NO_DATA_MESSAGE = 'Dados ainda não disponíveis.';

export interface AdminMetricsProps {
  /** Dados de indicadores de cursos populares já preparados pela camada de integração. */
  courseMetrics?: PopularCoursesMetricsData;
}

export const AdminMetrics = ({ courseMetrics = MOCK_COURSE_METRICS }: AdminMetricsProps) => {
  const kpiLeadingCards = (
    <>
      <SumCard
        className={styles.summaryCard}
        label="Alunos ativos"
        value="—"
        description={NO_DATA_MESSAGE}
      />
      <SumCard
        className={styles.summaryCard}
        label="Empresas parceiras"
        value="—"
        description={NO_DATA_MESSAGE}
      />
    </>
  );

  const kpiTrailingCards = (
    <section className={styles.completionRegion} aria-label="Taxa Média de Conclusão">
      <Panel
        className={`${styles.chartPanel} ${styles.completionPanel}`}
        title="Taxa Média de Conclusão"
      >
        {/* O trilho é apenas decorativo até a integração: não anuncia uma taxa de 0%. */}
        <div aria-hidden="true">
          <DonutChart
            className={styles.completionDonut}
            variant="progress"
            segments={[]}
            max={100}
            centerValue="—"
            centerLabel=""
            ariaLabel="Taxa média de conclusão"
            size="compact"
          />
        </div>
        <p className={styles.description}>{NO_DATA_MESSAGE}</p>
      </Panel>
    </section>
  );

  const middlePanel = (
    <Panel title="Top 5 Empresas Mais Engajadas" className={styles.chartPanel}>
      <BarList
        ranked
        items={MOCK_ENGAGED_COMPANIES}
        emptyMessage="Nenhuma empresa com matrículas registradas."
        aria-label="Top 5 empresas mais engajadas"
        className={styles.rankingList}
      />
    </Panel>
  );

  const bottomPanel = (
    <section aria-label="Evolução de Alunos Ativos" id="evolucao">
      <Panel className={styles.chartPanel} title="Evolução de Alunos Ativos">
        <p className={styles.description}>Últimos seis meses</p>
        {/* Área reservada para o LineChart na task de integração. */}
        <div className={styles.chartPlaceholder}>
          <p className={styles.emptyMessage}>{NO_DATA_MESSAGE}</p>
        </div>
      </Panel>
    </section>
  );

  return (
    <AuthenticatedLayout role="admin" items={MENU_ITEMS} user={ADMIN_USER}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Relatórios Gerais &amp; Métricas</h1>
          <p className={styles.description}>Visão geral de alunos e empresas parceiras.</p>
        </header>

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
