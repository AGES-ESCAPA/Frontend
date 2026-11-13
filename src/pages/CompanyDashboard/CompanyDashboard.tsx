import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import {
  Avatar,
  Badge,
  BarList,
  Button,
  EmptyState,
  FilterTabs,
  LineChart,
  Panel,
  ProgressBar,
  SearchBar,
  SumCard,
  Table,
} from '@components/ui';
import type { TableColumn } from '@components/ui';
import { useCompanyReportOverview } from '@hooks/useCompanyReportOverview';
import { useEmployeeProgress } from '@hooks/useEmployeeProgress';
import type { LoadStatus } from '@hooks/usePublicCourses';
import type {
  CompanyReportOverview,
  EmployeeProgress,
  EmployeeProgressStatus,
} from '@/types/companyReport';
import {
  formatHours,
  formatLastAccess,
  formatMonthLabel,
  formatPercent,
  isCompleted,
} from '@utils/companyReport';
import styles from './CompanyDashboard.module.css';

const COMPANY_USER: SidebarUser = {
  name: 'Empresa',
  role: 'Gestor Empresa',
};

const menuItems = SIDEBAR_MENU_PRESETS.company.map((item) => ({
  ...item,
  active: item.route === '/empresa/dashboard',
}));

const EMPLOYEES_ROUTE = '/empresa/colaboradores';
const UNAVAILABLE = '—';
const MAX_PAGE_BUTTONS = 5;
const TREND_LABEL = 'vs último mês';

const STATUS_OPTIONS: Record<string, EmployeeProgressStatus | null> = {
  Todos: null,
  'Em Andamento': 'IN_PROGRESS',
  Concluídos: 'COMPLETED',
};
const STATUS_LABELS = Object.keys(STATUS_OPTIONS);

/** Até cinco páginas em volta da atual, para a barra não crescer com muitos registros. */
const getVisiblePages = (page: number, totalPages: number): number[] => {
  const count = Math.min(MAX_PAGE_BUTTONS, totalPages);
  const first = Math.min(Math.max(page - Math.floor(count / 2), 0), totalPages - count);

  return Array.from({ length: count }, (_, index) => first + index);
};

/** O mesmo colaborador aparece uma vez por curso, então a linha é o par colaborador e curso. */
const getEmployeeProgressId = (row: EmployeeProgress): string => `${row.userId}-${row.courseId}`;

const buildColumns = (now: Date): TableColumn<EmployeeProgress>[] => [
  {
    id: 'employee',
    header: 'Colaborador',
    align: 'start',
    render: (row) => (
      <span className={styles.employee}>
        <Avatar name={row.name} imageUrl={row.avatarUrl ?? undefined} theme="dark" size="sm" />
        <span className={styles.employeeName}>{row.name}</span>
      </span>
    ),
  },
  {
    id: 'course',
    header: 'Curso',
    align: 'start',
    render: (row) => row.course,
  },
  {
    id: 'progress',
    header: '% Progresso',
    align: 'start',
    render: (row) => (
      <span className={styles.progress}>
        {/* A porcentagem ao lado já é lida; a barra é só visual. */}
        <span className={styles.progressBar} aria-hidden="true">
          <ProgressBar value={row.progress} variant={isCompleted(row) ? 'success' : 'default'} />
        </span>
        <span className={styles.progressValue}>{formatPercent(row.progress)}</span>
      </span>
    ),
  },
  {
    id: 'lastAccess',
    header: 'Último acesso',
    align: 'start',
    render: (row) => (
      <span className={styles.lastAccess}>{formatLastAccess(row.lastAccessAt, now)}</span>
    ),
  },
  {
    id: 'certificate',
    header: 'Certificado',
    align: 'center',
    render: (row) =>
      row.certificateIssued ? (
        <Badge label="Sim" variant="success" mini />
      ) : (
        <Badge label="Não" variant="error" mini />
      ),
  },
];

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onChange }: PaginationProps) => (
  <nav className={styles.pagination} aria-label="Paginação do acompanhamento">
    <button
      type="button"
      className={styles.pageButton}
      aria-label="Página anterior"
      disabled={page === 0}
      onClick={() => onChange(page - 1)}
    >
      <ChevronLeft size={16} aria-hidden="true" />
    </button>
    {getVisiblePages(page, totalPages).map((index) => (
      <button
        key={index}
        type="button"
        className={`${styles.pageButton} ${index === page ? styles.pageButtonActive : ''}`.trim()}
        aria-label={`Página ${index + 1}`}
        aria-current={index === page ? 'page' : undefined}
        onClick={() => onChange(index)}
      >
        {index + 1}
      </button>
    ))}
    <button
      type="button"
      className={styles.pageButton}
      aria-label="Próxima página"
      disabled={page + 1 >= totalPages}
      onClick={() => onChange(page + 1)}
    >
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  </nav>
);

interface SkeletonProps {
  label: string;
  className: string;
}

/** Bloco em carregamento: anunciado uma vez ao leitor de tela, com a forma do conteúdo. */
const Skeleton = ({ label, className }: SkeletonProps) => (
  <div role="status" aria-label={label} aria-busy="true">
    <div aria-hidden="true" className={`${styles.skeleton} ${className}`} />
  </div>
);

interface BlockErrorProps {
  message: string;
  onRetry: () => void;
}

/** Falha de um bloco: os outros continuam na tela e este oferece uma nova tentativa. */
const BlockError = ({ message, onRetry }: BlockErrorProps) => (
  <div className={styles.blockError}>
    <p className={styles.blockErrorMessage} role="alert">
      {message}
    </p>
    <Button
      className={styles.retryButton}
      type="button"
      variant="outlined"
      label="Tentar novamente"
      onClick={onRetry}
    />
  </div>
);

/** Valor do card: esqueleto enquanto carrega e traço quando os indicadores falharam. */
const renderCardValue = (
  status: LoadStatus,
  overview: CompanyReportOverview | null,
  label: string,
  format: (data: CompanyReportOverview) => string,
): ReactNode => {
  if (status === 'loading') {
    return <Skeleton label={`Carregando ${label}`} className={styles.valueSkeleton} />;
  }

  return overview ? format(overview) : UNAVAILABLE;
};

export const CompanyDashboard = () => {
  const report = useCompanyReportOverview();
  const [inputSearch, setInputSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusLabel, setStatusLabel] = useState(STATUS_LABELS[0]);
  const [page, setPage] = useState(0);
  const status = STATUS_OPTIONS[statusLabel] ?? null;
  const employees = useEmployeeProgress(search, status, page);

  const columns = useMemo(() => buildColumns(new Date()), []);
  const overview = report.status === 'success' ? report.overview : null;

  const handleSearch = useCallback((value: string) => {
    setPage(0);
    setSearch(value);
  }, []);

  const handleStatusChange = (label: string) => {
    setPage(0);
    setStatusLabel(label);
  };

  // Sem busca, filtro nem página, uma lista vazia quer dizer que a empresa não tem colaboradores
  // em cursos: no lugar de indicadores zerados, o gestor é levado à Gestão de Colaboradores.
  const isEmptyCompany =
    employees.status === 'success' &&
    employees.totalElements === 0 &&
    search.trim() === '' &&
    status === null &&
    page === 0;

  const departmentItems = (overview?.completionByJobTitle ?? []).map((item) => ({
    id: item.jobTitle,
    label: item.jobTitle,
    value: item.completionRate,
    displayValue: formatPercent(item.completionRate),
  }));
  const monthlyHours = (overview?.monthlyHours ?? []).map((item) => ({
    label: formatMonthLabel(item.month),
    value: item.averageHours,
  }));

  const renderChart = (label: string, chart: ReactNode) => {
    if (report.status === 'loading') {
      return <Skeleton label={`Carregando ${label}`} className={styles.chartSkeleton} />;
    }

    return overview ? chart : <p className={styles.unavailable}>Gráfico indisponível.</p>;
  };

  const renderTable = () => {
    if (employees.status === 'loading') {
      return (
        <Skeleton
          label="Carregando acompanhamento por colaborador"
          className={styles.tableSkeleton}
        />
      );
    }

    if (employees.status === 'error') {
      return (
        <BlockError
          message={employees.errorMessage ?? 'Não foi possível carregar o acompanhamento.'}
          onRetry={employees.reload}
        />
      );
    }

    return (
      <Table<EmployeeProgress>
        columns={columns}
        data={employees.rows}
        getRowId={getEmployeeProgressId}
        caption="Acompanhamento por colaborador"
        emptyMessage="Nenhum colaborador encontrado para a busca ou o filtro."
        footer={
          <div className={styles.footer}>
            <p className={styles.count}>
              Mostrando <strong>{employees.rows.length}</strong> de{' '}
              <strong>{employees.totalElements}</strong> registros
            </p>
            {employees.totalPages > 1 ? (
              <Pagination page={page} totalPages={employees.totalPages} onChange={setPage} />
            ) : null}
          </div>
        }
      />
    );
  };

  return (
    <AuthenticatedLayout role="company" items={menuItems} user={COMPANY_USER}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard de Engajamento</h1>
          <p className={styles.subtitle}>
            Acompanhe o progresso das turmas, a taxa de conclusão global e os retornos da
            capacitação corporativa.
          </p>
        </header>

        {isEmptyCompany ? (
          <EmptyState
            title="Sua equipe ainda não está em nenhum curso"
            description="Cadastre colaboradores e atribua cursos a eles para acompanhar o engajamento da equipe por aqui."
            action={
              <Button asChild variant="primary" label="Ir para Gestão de Colaboradores">
                <Link to={EMPLOYEES_ROUTE} />
              </Button>
            }
          />
        ) : (
          <>
            {report.status === 'error' ? (
              <BlockError
                message={
                  report.errorMessage ?? 'Não foi possível carregar os indicadores da equipe.'
                }
                onRetry={report.reload}
              />
            ) : null}

            <section className={styles.cards} aria-label="Indicadores da equipe">
              <SumCard
                label="Taxa de conclusão global"
                value={renderCardValue(
                  report.status,
                  overview,
                  'taxa de conclusão global',
                  (data) => formatPercent(data.completionRate),
                )}
                trend={
                  overview
                    ? { value: overview.completionRateChange, label: TREND_LABEL }
                    : undefined
                }
              />
              <SumCard
                label="Média de horas cursadas"
                value={renderCardValue(report.status, overview, 'média de horas cursadas', (data) =>
                  formatHours(data.averageHoursPerEmployee),
                )}
                description="por colaborador"
              />
              <SumCard
                label="Certificados emitidos"
                value={renderCardValue(report.status, overview, 'certificados emitidos', (data) =>
                  data.certificatesThisQuarter.toLocaleString('pt-BR'),
                )}
                description="no trimestre atual"
              />
              <SumCard
                label="Engajamento semanal"
                value={renderCardValue(report.status, overview, 'engajamento semanal', (data) =>
                  formatPercent(data.weeklyEngagement),
                )}
                trend={
                  overview?.weeklyEngagementChange == null
                    ? undefined
                    : { value: overview.weeklyEngagementChange, label: TREND_LABEL }
                }
                description="colaboradores ativos"
              />
            </section>

            <div className={styles.charts}>
              <Panel className={styles.panel} title="Conclusão por Departamento">
                {renderChart(
                  'conclusão por departamento',
                  <BarList
                    items={departmentItems}
                    max={100}
                    aria-label="Taxa de conclusão por departamento"
                    emptyMessage="Nenhum departamento com colaboradores matriculados."
                  />,
                )}
              </Panel>

              <Panel className={styles.panel} title="Evolução Mensal de Horas">
                <p className={styles.panelDescription}>
                  Média de horas dedicadas nos últimos 6 meses
                </p>
                {renderChart(
                  'evolução mensal de horas',
                  <LineChart
                    data={monthlyHours}
                    valueFormatter={formatHours}
                    height={220}
                    ariaLabel="Média mensal de horas por colaborador"
                  />,
                )}
              </Panel>
            </div>

            <Panel className={styles.panel}>
              <div className={styles.toolbar}>
                <h2 className={styles.tableTitle}>Acompanhamento por Colaborador</h2>
                <div className={styles.controls}>
                  <div className={styles.search}>
                    <SearchBar
                      value={inputSearch}
                      onChange={setInputSearch}
                      onSearch={handleSearch}
                      placeholder="Buscar colaborador"
                      aria-label="Buscar colaborador pelo nome"
                    />
                  </div>
                  <FilterTabs
                    options={STATUS_LABELS}
                    selected={statusLabel}
                    onChange={handleStatusChange}
                    variant="ghost-dark"
                    groupLabel="Filtrar por situação do curso"
                  />
                </div>
              </div>

              {renderTable()}
            </Panel>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
};
