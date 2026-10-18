import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import {
  Button,
  CourseCard,
  CourseCardSkeleton,
  FilterTabs,
  SearchBar,
  type EnrollmentStatus,
} from '@components/ui';
import { useCourseFilters } from '@hooks/useCourseFilters';
import { usePublicCourses } from '@hooks/usePublicCourses';
import { getStudentCurriculum } from '@services/curriculumService';
import { getStudentEnrollments } from '@services/enrollmentService';
import type { PublicCourseCard } from '@/types/course';
import { mapPublicCourseToCardProps, toDisplayLevel } from '@utils/mapPublicCourse';
import styles from './Courses.module.css';

const ALL_FILTER = 'Todos';
const FEATURED_SKELETONS = 3;

const usersByRole: Record<SidebarRole, SidebarUser> = {
  student: {
    name: 'Jorge Amado',
    role: 'Aluno',
    email: 'aluno@email.com',
  },
  admin: {
    name: 'Admin',
    role: 'Administrador',
    email: 'admin@email.com',
  },
  company: {
    name: 'Escapa!',
    role: 'Empresa',
    email: 'escapa@email.com',
  },
};

const CATALOG_SKELETONS = 6;
const OWNED_PAGE_SIZE = 50;
const MAX_OWNED_PAGES = 20;

const ACQUIRED_ENROLLMENT_STATUSES = new Set<EnrollmentStatus>([
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
]);

const toOptionalFilter = (value: string): string | undefined =>
  value === ALL_FILTER ? undefined : value;

const formatFoundCount = (total: number): string =>
  total === 1 ? '1 curso encontrado' : `${total} cursos encontrados`;

const getRoleFromPathname = (pathname: string): SidebarRole => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/empresa')) return 'company';
  return 'student';
};

const loadOwnedCourseIds = async (): Promise<Set<string>> => {
  const ids = new Set<string>();
  let page = 0;
  let totalPages = 1;

  do {
    const result = await getStudentEnrollments({ page, size: OWNED_PAGE_SIZE });
    result.content.forEach((enrollment) => {
      if (ACQUIRED_ENROLLMENT_STATUSES.has(enrollment.enrollmentStatus)) {
        ids.add(enrollment.courseId);
      }
    });
    totalPages = result.totalPages;
    page += 1;
  } while (page < totalPages && page < MAX_OWNED_PAGES);

  return ids;
};

export const Courses = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const role = getRoleFromPathname(pathname);
  const isStudent = role === 'student';
  const currentUser = usersByRole[role];
  const courseItems = SIDEBAR_MENU_PRESETS[role].map((item, index) => ({
    ...item,
    active: index === 0,
  }));
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(ALL_FILTER);
  const [level, setLevel] = useState(ALL_FILTER);
  const { categories, levels } = useCourseFilters();
  const categoryOptions = [ALL_FILTER, ...categories];
  const levelOptions = [ALL_FILTER, ...levels.map((value) => toDisplayLevel(value))];
  const {
    featured,
    featuredStatus,
    catalog,
    catalogStatus,
    totalElements,
    reloadFeatured,
    reloadCatalog,
    reloadAll,
  } = usePublicCourses({
    title: searchTerm || undefined,
    category: toOptionalFilter(category),
    level: toOptionalFilter(level),
  });
  const [ownedCourseIds, setOwnedCourseIds] = useState<ReadonlySet<string>>(() => new Set());
  const [enrollmentsReady, setEnrollmentsReady] = useState(!isStudent);

  useEffect(() => {
    if (!isStudent) {
      setOwnedCourseIds(new Set());
      setEnrollmentsReady(true);
      return undefined;
    }

    let cancelled = false;
    setEnrollmentsReady(false);

    const loadEnrollments = async () => {
      try {
        const ids = await loadOwnedCourseIds();
        if (!cancelled) setOwnedCourseIds(ids);
      } catch {
        if (!cancelled) setOwnedCourseIds(new Set());
      } finally {
        if (!cancelled) setEnrollmentsReady(true);
      }
    };

    void loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [isStudent]);

  const handleLogout = () => {
    window.location.assign('/');
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/cursos/${courseId}`);
  };

  const handleAccess = async (courseId: string) => {
    try {
      const curriculum = await getStudentCurriculum(courseId);
      const lessons = curriculum.modules.flatMap((module) => module.lessons);
      const nextLesson = lessons.find((lesson) => lesson.status === 'AVAILABLE') ?? lessons[0];
      if (nextLesson) {
        navigate(`/aluno/cursos/${courseId}/aulas/${nextLesson.id}`);
        return;
      }
    } catch {
      // Sem grade disponível, a página do curso ainda permite consultar o conteúdo.
    }

    navigate(`/cursos/${courseId}`);
  };

  const ownedStateReady = !isStudent || enrollmentsReady;
  const showPageError = featuredStatus === 'error' && catalogStatus === 'error';

  const renderCourseCard = (course: PublicCourseCard) => {
    const acquired = isStudent && ownedCourseIds.has(course.id);

    return (
      <CourseCard
        key={course.id}
        {...mapPublicCourseToCardProps(course, handleCourseClick)}
        acquired={acquired}
        onAccess={acquired ? handleAccess : undefined}
      />
    );
  };

  return (
    <AuthenticatedLayout
      role={role}
      items={courseItems}
      user={currentUser}
      notificationsCount={2}
      onLogout={handleLogout}
    >
      {role === 'admin' ? (
        <div className={styles.adminActions}>
          <Button asChild variant="secondary" label="Novo Curso">
            <Link to="/admin/cursos/novo" />
          </Button>
        </div>
      ) : null}

      {showPageError ? (
        <section className={styles.errorState} role="alert">
          <h1 className={styles.errorTitle}>Não foi possível carregar os cursos</h1>
          <p className={styles.errorDescription}>
            Verifique sua conexão e tente novamente em instantes.
          </p>
          <Button variant="primary" label="Tentar Novamente" onClick={reloadAll} />
        </section>
      ) : (
        <>
          <section className={styles.section} aria-labelledby="featured-heading">
            <p className={styles.catalogEyebrow}>Catálogo</p>
            <h1 id="featured-heading" className={styles.heading}>
              Cursos em Destaque
            </h1>

            {(featuredStatus === 'loading' ||
              (featuredStatus === 'success' && !ownedStateReady)) && (
              <div className={styles.grid} role="status" aria-label="Carregando cursos em destaque">
                {Array.from({ length: FEATURED_SKELETONS }, (_, index) => (
                  <CourseCardSkeleton key={`featured-skeleton-${index}`} />
                ))}
              </div>
            )}

            {featuredStatus === 'error' && (
              <div className={styles.inlineError} role="alert">
                <p>Não foi possível carregar os cursos em destaque.</p>
                <Button variant="outlined" label="Tentar Novamente" onClick={reloadFeatured} />
              </div>
            )}

            {featuredStatus === 'success' && ownedStateReady && featured.length > 0 && (
              <div className={styles.grid}>{featured.map(renderCourseCard)}</div>
            )}
          </section>

          <section className={styles.section} aria-labelledby="catalog-heading">
            <h2 id="catalog-heading" className={styles.heading}>
              Todos os Cursos
            </h2>

            <div className={styles.catalogToolbar}>
              <div className={styles.searchWrap}>
                <SearchBar
                  value={searchValue}
                  onChange={setSearchValue}
                  onSearch={setSearchTerm}
                  placeholder="Buscar por nome ou tema"
                />
              </div>
              <div className={styles.categoryTabs}>
                <FilterTabs
                  options={categoryOptions}
                  selected={category}
                  onChange={setCategory}
                  groupLabel="Categoria"
                />
              </div>
              <div className={styles.filterDivider} />
              <div className={styles.levelTabs}>
                <FilterTabs
                  options={levelOptions}
                  selected={level}
                  onChange={setLevel}
                  variant="ghost-dark"
                  groupLabel="Nível"
                />
              </div>
            </div>

            {(catalogStatus === 'loading' || (catalogStatus === 'success' && !ownedStateReady)) && (
              <div className={styles.grid} role="status" aria-label="Carregando cursos">
                {Array.from({ length: CATALOG_SKELETONS }, (_, index) => (
                  <CourseCardSkeleton key={`catalog-skeleton-${index}`} />
                ))}
              </div>
            )}

            {catalogStatus === 'error' && (
              <div className={styles.errorState} role="alert">
                <h3 className={styles.errorTitle}>Não foi possível carregar os cursos</h3>
                <p className={styles.errorDescription}>
                  Verifique sua conexão e tente novamente em instantes.
                </p>
                <Button variant="primary" label="Tentar Novamente" onClick={reloadCatalog} />
              </div>
            )}

            {catalogStatus === 'success' && ownedStateReady && (
              <>
                <p className={styles.resultsCount}>{formatFoundCount(totalElements)}</p>
                {catalog.length === 0 ? (
                  <p className={styles.emptyState}>
                    Nenhum curso encontrado para os filtros atuais.
                  </p>
                ) : (
                  <div className={styles.grid}>{catalog.map(renderCourseCard)}</div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </AuthenticatedLayout>
  );
};
