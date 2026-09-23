import { useState, useEffect } from 'react';
import { FilterTabs, SearchBar, StudentCourseCard, EmptyState, Button } from '@components/ui';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout/AuthenticatedLayout';
import { SIDEBAR_MENU_PRESETS } from '../../components/layout/Sidebar/sidebarMenuPresets';
import styles from './MyCourses.module.css';
import { mockUser } from './mockCourses';
import { getStudentEnrollments } from '../../services/enrollmentService';
import type { StudentCourseCardResponse } from '../../services/enrollmentService';
import type { EnrollmentStatus } from '../../components/ui/StudentCourseCard';

export type TabType = 'Todos' | 'Em andamento' | 'Aguardando' | 'Concluídos' | 'Expirados';

const tabOptions: TabType[] = ['Todos', 'Em andamento', 'Aguardando', 'Concluídos', 'Expirados'];
const statusByTab: Record<Exclude<TabType, 'Todos'>, EnrollmentStatus> = {
  'Em andamento': 'IN_PROGRESS',
  Aguardando: 'PENDING',
  Concluídos: 'COMPLETED',
  Expirados: 'EXPIRED',
};

export const MyCourses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Todos');

  const [courses, setCourses] = useState<StudentCourseCardResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
    setCourses([]);
  }, [activeTab, debouncedSearchTerm]);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const statusParam = activeTab !== 'Todos' ? statusByTab[activeTab] : undefined;
        const result = await getStudentEnrollments({
          query: debouncedSearchTerm || undefined,
          status: statusParam,
          page,
          size: 10,
        });

        if (isMounted) {
          if (page === 0) {
            setCourses(result.content);
          } else {
            setCourses((prev) => [...prev, ...result.content]);
          }
          setHasMore(result.pageNumber < result.totalPages - 1);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar cursos');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [activeTab, debouncedSearchTerm, page]);

  const inProgressCourses = courses.filter((c) => c.enrollmentStatus === 'IN_PROGRESS');
  const pendingCourses = courses.filter((c) => c.enrollmentStatus === 'PENDING');
  const completedCourses = courses.filter((c) => c.enrollmentStatus === 'COMPLETED');
  const expiredCourses = courses.filter((c) => c.enrollmentStatus === 'EXPIRED');

  const renderCourseGrid = (courseList: StudentCourseCardResponse[]) => (
    <div className={styles.courseGrid}>
      {courseList.map((course) => (
        <StudentCourseCard
          key={course.courseId}
          courseId={course.courseId}
          title={course.title}
          instructor={course.instructor ?? ''}
          thumbnailUrl={course.thumbnailUrl ?? ''}
          durationTime={course.durationTime ?? 0}
          lessonsCount={course.lessonsCount}
          progressPercentage={course.progressPercentage ?? 0}
          enrollmentStatus={course.enrollmentStatus}
        />
      ))}
    </div>
  );

  return (
    <AuthenticatedLayout
      role="student"
      user={mockUser}
      items={SIDEBAR_MENU_PRESETS.student.map((item) => ({
        ...item,
        active: item.label === 'Meus Cursos',
      }))}
      notificationsCount={3}
    >
      <section className={styles.pageContent}>
        <header className={styles.topHeader}>
          <div className={styles.titleSection}>
            <span className={styles.breadcrumb}>ÁREA DO ALUNO • Meus Cursos</span>
            <h1>Meus Cursos</h1>
            <p>Continue de onde você parou</p>
          </div>

          <div className={styles.controlsSection}>
            <div className={styles.searchContainer}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                aria-label="Buscar em meus cursos"
              />
            </div>
            <div className={styles.tabContainer}>
              <FilterTabs
                options={tabOptions}
                selected={activeTab}
                onChange={(value) => setActiveTab(value as TabType)}
                groupLabel="Filtrar cursos por status"
              />
            </div>
          </div>
        </header>

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button label="Tentar novamente" onClick={() => setPage(0)} variant="outlined" />
          </div>
        )}

        {!error && !isLoading && courses.length === 0 ? (
          <EmptyState
            title="Nenhum curso encontrado"
            description="Não encontramos nenhum curso com os filtros atuais. Que tal explorar o catálogo?"
            action={<Button label="Explorar Catálogo" variant="outlined" onClick={() => {}} />}
          />
        ) : (
          <div className={styles.coursesContainer}>
            {activeTab === 'Todos' ? (
              <>
                {inProgressCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      ▶ Em Andamento{' '}
                      <span className={styles.badge}>{inProgressCourses.length}</span>
                    </h2>
                    {renderCourseGrid(inProgressCourses)}
                  </section>
                )}

                {pendingCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      ⏳ Aguardando Liberação{' '}
                      <span className={styles.badge}>{pendingCourses.length}</span>
                    </h2>
                    {renderCourseGrid(pendingCourses)}
                  </section>
                )}

                {completedCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      ✅ Concluídos <span className={styles.badge}>{completedCourses.length}</span>
                    </h2>
                    {renderCourseGrid(completedCourses)}
                  </section>
                )}

                {expiredCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      ❌ Expirados <span className={styles.badge}>{expiredCourses.length}</span>
                    </h2>
                    {renderCourseGrid(expiredCourses)}
                  </section>
                )}
              </>
            ) : (
              <section className={styles.courseSection}>{renderCourseGrid(courses)}</section>
            )}

            {isLoading && (
              <div className={styles.loadingContainer}>
                <p>Carregando cursos...</p>
              </div>
            )}

            {hasMore && !isLoading && (
              <div className={styles.loadMoreContainer}>
                <Button
                  label="Carregar mais"
                  onClick={() => setPage((p) => p + 1)}
                  variant="outlined"
                />
              </div>
            )}
          </div>
        )}
      </section>
    </AuthenticatedLayout>
  );
};
