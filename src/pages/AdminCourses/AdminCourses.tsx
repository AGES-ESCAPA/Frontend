import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SquarePen, Trash2 } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import {
  Badge,
  Button,
  ConfirmDialog,
  ProgressBar,
  SearchBar,
  SumCard,
  Table,
  Toast,
} from '@components/ui';
import type { BadgeVariant, TableColumn } from '@components/ui';
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
    course.code.toLowerCase().includes(normalized)
  );
};

export const AdminCourses = () => {
  const { courses, status, errorMessage, reload, archiveCourse } = useAdminCourses();
  const { toast, isOpen, showToast, dismissToast } = useToast();
  const [search, setSearch] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<AdminCourseRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuItems = useMemo(
    () => SIDEBAR_MENU_PRESETS.admin.map((item, index) => ({ ...item, active: index === 0 })),
    [],
  );

  const publishedCount = courses.filter((course) => course.status === 'PUBLISHED').length;
  const draftCount = courses.filter((course) => course.status === 'DRAFT').length;
  const totalCount = courses.length;
  const averagePrice =
    totalCount === 0 ? 0 : courses.reduce((sum, course) => sum + course.price, 0) / totalCount;

  const visibleCourses = useMemo(
    () => courses.filter((course) => matchesSearch(course, search)),
    [courses, search],
  );

  const handleLogout = useCallback(() => {
    window.location.assign('/');
  }, []);

  const requestDelete = useCallback((course: AdminCourseRow) => {
    setCourseToDelete(course);
  }, []);

  const handleDeleteDialogChange = useCallback(
    (open: boolean) => {
      if (!open && !isDeleting) {
        setCourseToDelete(null);
      }
    },
    [isDeleting],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      await archiveCourse(courseToDelete.id);
      showToast('success', 'Curso arquivado', `${courseToDelete.title} saiu do catálogo ativo.`);
      setCourseToDelete(null);
    } catch (error: unknown) {
      showToast(
        'error',
        'Não foi possível arquivar o curso',
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsDeleting(false);
    }
  }, [archiveCourse, courseToDelete, showToast]);

  const columns = useMemo<TableColumn<AdminCourseRow>[]>(
    () => [
      {
        id: 'code',
        header: 'Curso',
        render: (course) => <span className={styles.code}>{course.code}</span>,
      },
      {
        id: 'title',
        header: 'Categoria',
        render: (course) => course.title,
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
        render: (course) => (
          <div className={styles.rowActions}>
            <Link
              to={`/admin/cursos/${course.id}/editar`}
              className={styles.iconButton}
              aria-label={`Editar ${course.title}`}
            >
              <SquarePen size={ACTION_ICON_SIZE} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.deleteButton}`}
              aria-label={`Excluir ${course.title}`}
              onClick={() => requestDelete(course)}
            >
              <Trash2 size={ACTION_ICON_SIZE} aria-hidden="true" />
            </button>
          </div>
        ),
      },
    ],
    [requestDelete],
  );

  return (
    <>
      <AuthenticatedLayout
        role="admin"
        items={menuItems}
        user={ADMIN_USER}
        notificationsCount={2}
        onLogout={handleLogout}
      >
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

            <section className={styles.catalog} aria-labelledby="catalog-heading">
              <div className={styles.toolbar}>
                <h2 id="catalog-heading" className={styles.heading}>
                  Cursos
                </h2>

                <div className={styles.toolbarActions}>
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
        open={courseToDelete !== null}
        title="Excluir curso?"
        description={
          courseToDelete
            ? `Esta ação deletara o curso “${courseToDelete.title}”. Não é possível desfazer pelo painel após a confirmação.`
            : ''
        }
        confirmLabel="Excluir curso"
        isConfirming={isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onOpenChange={handleDeleteDialogChange}
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
