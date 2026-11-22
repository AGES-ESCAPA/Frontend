import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, SquarePen } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import {
  Badge,
  Button,
  ConfirmDialog,
  PageHeader,
  ProgressBar,
  SearchBar,
  SumCard,
  Table,
  TableFilter,
  Toast,
} from '@components/ui';
import type {
  BadgeVariant,
  ConfirmDialogVariant,
  SelectInputOption,
  TableColumn,
  TableFilterSelectField,
} from '@components/ui';
import { useAdminCourses } from '@hooks/useAdminCourses';
import { useToast } from '@hooks/useToast';
import { formatCurrency } from '@utils/formatters';
import type { AdminCourseRow, CourseStatus } from '@/types/course';
import styles from './AdminCourses.module.css';

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

type CourseStatusAction = 'archive' | 'unarchive';

type PendingCourseAction = {
  course: AdminCourseRow;
  type: CourseStatusAction;
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const STATUS_VARIANTS: Record<CourseStatus, BadgeVariant> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

const ALL_OPTION: SelectInputOption = { value: '', label: 'Todos' };

const STATUS_FILTER_OPTIONS: readonly SelectInputOption[] = [
  ALL_OPTION,
  { value: 'DRAFT', label: STATUS_LABELS.DRAFT },
  { value: 'PUBLISHED', label: STATUS_LABELS.PUBLISHED },
  { value: 'ARCHIVED', label: STATUS_LABELS.ARCHIVED },
];

const ACTION_ICON_SIZE = 16;

const formatTicketAverage = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);

const matchesSearch = (course: AdminCourseRow, term: string): boolean => {
  const normalized = term.trim().toLowerCase();
  if (normalized === '') return true;

  return (
    course.title.toLowerCase().includes(normalized) ||
    course.code.toLowerCase().includes(normalized) ||
    (course.category?.toLowerCase().includes(normalized) ?? false)
  );
};

export const AdminCourses = () => {
  const { courses, status, errorMessage, reload, archiveCourse, unarchiveCourse } =
    useAdminCourses();
  const { toast, isOpen, showToast, dismissToast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingCourseAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const menuItems = useMemo(
    () => SIDEBAR_MENU_PRESETS.admin.map((item, index) => ({ ...item, active: index === 0 })),
    [],
  );

  const publishedCount = courses.filter((course) => course.status === 'PUBLISHED').length;
  const draftCount = courses.filter((course) => course.status === 'DRAFT').length;
  const totalCount = courses.length;
  const averagePrice =
    totalCount === 0 ? 0 : courses.reduce((sum, course) => sum + course.price, 0) / totalCount;

  const categoryOptions = useMemo<readonly SelectInputOption[]>(() => {
    const unique = Array.from(
      new Set(
        courses
          .map((course) => course.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return [ALL_OPTION, ...unique.map((category) => ({ value: category, label: category }))];
  }, [courses]);

  const filterSelects: TableFilterSelectField[] = [
    {
      id: 'category',
      label: 'Categoria',
      value: categoryFilter,
      options: categoryOptions,
      onChange: setCategoryFilter,
    },
    {
      id: 'status',
      label: 'Status',
      value: statusFilter,
      options: STATUS_FILTER_OPTIONS,
      onChange: setStatusFilter,
    },
  ];

  const visibleCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesCategory = categoryFilter === '' || course.category?.trim() === categoryFilter;
        const matchesStatus = statusFilter === '' || course.status === statusFilter;
        return matchesCategory && matchesStatus && matchesSearch(course, search);
      }),
    [courses, search, categoryFilter, statusFilter],
  );

  const requestStatusAction = useCallback((course: AdminCourseRow, type: CourseStatusAction) => {
    setPendingAction({ course, type });
  }, []);

  const handleConfirmDialogChange = useCallback(
    (open: boolean) => {
      if (!open && !isConfirming) {
        setPendingAction(null);
      }
    },
    [isConfirming],
  );

  const handleConfirmStatusAction = useCallback(async () => {
    if (!pendingAction) return;

    const { course, type } = pendingAction;
    setIsConfirming(true);
    try {
      if (type === 'archive') {
        await archiveCourse(course.id);
        showToast('success', 'Curso arquivado', `${course.title} saiu do catálogo ativo.`);
      } else {
        await unarchiveCourse(course.id);
        showToast(
          'success',
          'Curso desarquivado',
          `${course.title} voltou ao catálogo como publicado.`,
        );
      }
      setPendingAction(null);
    } catch (error: unknown) {
      showToast(
        'error',
        type === 'archive'
          ? 'Não foi possível arquivar o curso'
          : 'Não foi possível desarquivar o curso',
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsConfirming(false);
    }
  }, [archiveCourse, pendingAction, showToast, unarchiveCourse]);

  const confirmDialogVariant: ConfirmDialogVariant =
    pendingAction?.type === 'unarchive' ? 'success' : 'danger';
  const confirmDialogTitle =
    pendingAction?.type === 'unarchive' ? 'Desarquivar curso?' : 'Arquivar curso?';
  const confirmDialogLabel =
    pendingAction?.type === 'unarchive' ? 'Desarquivar curso' : 'Arquivar curso';
  const confirmDialogDescription = pendingAction
    ? pendingAction.type === 'unarchive'
      ? `Esta ação desarquivará o curso “${pendingAction.course.title}” e o publicará novamente no catálogo.`
      : `Esta ação arquivará o curso “${pendingAction.course.title}”. Ele sairá do catálogo ativo e poderá ser consultado no filtro Arquivado.`
    : '';

  const columns = useMemo<TableColumn<AdminCourseRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Curso',
        render: (course) => course.title,
      },
      {
        id: 'category',
        header: 'Categoria',
        render: (course) =>
          course.category ? <Badge category={course.category} mini={true} /> : '—',
      },
      {
        id: 'price',
        header: 'Preço',
        render: (course) => formatCurrency(course.price),
      },
      {
        id: 'status',
        header: 'Status',
        render: (course) => (
          <Badge
            label={STATUS_LABELS[course.status]}
            variant={STATUS_VARIANTS[course.status]}
            mini
          />
        ),
      },
      {
        id: 'version',
        header: 'Versão',
        render: (course) => <span className={styles.version}>{course.version}</span>,
      },
      {
        id: 'actions',
        header: 'Ações',
        render: (course) => {
          const isArchived = course.status === 'ARCHIVED';
          return (
            <div className={styles.rowActions}>
              <Link
                to={`/admin/cursos/${course.id}/editar`}
                className={styles.iconButton}
                aria-label={`Editar ${course.title}`}
                title="Editar curso"
              >
                <SquarePen size={ACTION_ICON_SIZE} aria-hidden="true" />
              </Link>
              {isArchived ? (
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.unarchiveButton}`}
                  aria-label={`Desarquivar ${course.title}`}
                  title="Desarquivar curso"
                  onClick={() => requestStatusAction(course, 'unarchive')}
                >
                  <ArchiveRestore size={ACTION_ICON_SIZE} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.archiveButton}`}
                  aria-label={`Arquivar ${course.title}`}
                  title="Arquivar curso"
                  onClick={() => requestStatusAction(course, 'archive')}
                >
                  <Archive size={ACTION_ICON_SIZE} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [requestStatusAction],
  );

  return (
    <>
      <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER} notificationsCount={2}>
        {status === 'error' ? (
          <section className={styles.errorState} role="alert">
            <h1 className={styles.errorTitle}>Não foi possível carregar os cursos</h1>
            <p className={styles.errorDescription}>
              {errorMessage ?? 'Verifique sua conexão e tente novamente em instantes.'}
            </p>
            <Button variant="primary" label="Tentar Novamente" onClick={reload} />
          </section>
        ) : (
          <>
            <PageHeader
              eyebrow="Painel administrativo • Cursos"
              title="Gestão de Cursos"
              subtitle="Gerencie o catálogo de cursos da plataforma."
            />

            <section className={styles.stats} aria-label="Resumo do catálogo">
              <SumCard
                label="Total de Cursos"
                value={status === 'loading' ? '—' : totalCount}
                description="Catálogo completo ativo"
              />
              <SumCard
                label="Cursos Publicados"
                value={status === 'loading' ? '—' : publishedCount}
                description={`${draftCount} em rascunho`}
              />
              <SumCard
                label="Média de Preço"
                value={status === 'loading' ? '—' : formatTicketAverage(averagePrice)}
                description="Ticket médio"
              />
            </section>

            <section className={styles.catalog} aria-label="Cursos">
              <div className={styles.toolbar}>
                <div className={styles.toolbarActions}>
                  <TableFilter
                    selects={filterSelects}
                    showClearButton={false}
                    className={styles.inlineFilters}
                  />
                  <div className={styles.search}>
                    <SearchBar
                      value={search}
                      onChange={setSearch}
                      placeholder="Buscar curso"
                      aria-label="Buscar curso"
                    />
                  </div>

                  <Button
                    asChild
                    variant="primary"
                    label="Novo Curso"
                    className={styles.newCourseButton}
                  >
                    <Link to="/admin/cursos/novo" />
                  </Button>
                </div>
              </div>

              <div className={styles.progressRow}>
                <p className={styles.progressLabel}>
                  {publishedCount}/{totalCount} publicados
                </p>
                <div className={styles.progressBar}>
                  <ProgressBar
                    value={publishedCount}
                    max={totalCount}
                    aria-label={`${publishedCount} de ${totalCount} cursos publicados`}
                  />
                </div>
              </div>

              {status === 'loading' ? (
                <p className={styles.loading} role="status">
                  Carregando cursos…
                </p>
              ) : (
                <Table
                  columns={columns}
                  data={visibleCourses}
                  getRowId={(course) => course.id}
                  caption="Cursos cadastrados"
                  emptyMessage="Nenhum curso encontrado."
                  footer={`Mostrando ${visibleCourses.length} de ${totalCount} cursos`}
                />
              )}
            </section>
          </>
        )}
      </AuthenticatedLayout>

      <ConfirmDialog
        open={pendingAction !== null}
        variant={confirmDialogVariant}
        title={confirmDialogTitle}
        description={confirmDialogDescription}
        confirmLabel={confirmDialogLabel}
        isConfirming={isConfirming}
        onConfirm={() => {
          void handleConfirmStatusAction();
        }}
        onOpenChange={handleConfirmDialogChange}
      />

      {toast ? (
        <Toast
          key={toast.key}
          open={isOpen}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
        />
      ) : null}
    </>
  );
};
