import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import { DonutChart, SumCard } from '@components/ui';
import styles from './AdminMetrics.module.css';

const ADMIN_USER = { name: 'Admin', role: 'Administrador' };
const MENU_ITEMS = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
  ...item,
  active: item.route === '/admin/metricas',
}));
const NO_DATA_MESSAGE = 'Dados ainda não disponíveis.';

export const AdminMetrics = () => (
  <AuthenticatedLayout role="admin" items={MENU_ITEMS} user={ADMIN_USER}>
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios Gerais &amp; Métricas</h1>
        <p className={styles.description}>Visão geral de alunos e empresas parceiras.</p>
      </header>

      {/* A grade permite acrescentar os indicadores da US-37 na mesma página. */}
      <div className={styles.summaryGrid}>
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
        <section
          className={`${styles.panel} ${styles.completionPanel}`}
          aria-labelledby="completion-title"
        >
          <h2 className={styles.panelTitle} id="completion-title">
            Taxa Média de Conclusão
          </h2>
          {/* O trilho é apenas decorativo até a integração: não anuncia uma taxa de 0%. */}
          <div aria-hidden="true">
            <DonutChart
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
        </section>
      </div>

      <section className={styles.panel} aria-labelledby="evolution-title" id="evolucao">
        <div className={styles.evolution}>
          <h2 className={styles.panelTitle} id="evolution-title">
            Evolução de Alunos Ativos
          </h2>
          <p className={styles.description}>Últimos seis meses</p>
        </div>
        {/* Área reservada para o LineChart na task de integração. */}
        <div className={styles.chartPlaceholder}>
          <p className={styles.emptyMessage}>{NO_DATA_MESSAGE}</p>
        </div>
      </section>
    </div>
  </AuthenticatedLayout>
);
