import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, CheckCircle, Ban } from 'lucide-react';
import {
  FilterTabs,
  PageHeader,
  SearchBar,
  StudentCourseCard,
  EmptyState,
  Button,
} from '@components/ui';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout/AuthenticatedLayout';
import { SIDEBAR_MENU_PRESETS } from '../../components/layout/Sidebar/sidebarMenuPresets';
import { useOptionalAuth } from '@contexts/useAuth';
import { useNetworkRecovery } from '@contexts/useConnectivity';
import { getCachedResource, resourceCacheKeys, setCachedResource } from '@services/resourceCache';
import styles from './MyCourses.module.css';
import { mockUser } from './mockCourses';
import { getStudentEnrollments } from '../../services/enrollmentService';
import type { StudentCourseCardResponse } from '../../services/enrollmentService';
import type { EnrollmentStatus } from '../../components/ui/StudentCourseCard';
import { getStudentCurriculum } from '../../services/curriculumService';

export type TabType = 'Todos' | 'Em andamento' | 'Aguardando' | 'Concluídos' | 'Expirados';

const tabOptions: TabType[] = ['Todos', 'Em andamento', 'Aguardando', 'Concluídos', 'Expirados'];
const statusByTab: Record<Exclude<TabType, 'Todos'>, EnrollmentStatus> = {
  'Em andamento': 'IN_PROGRESS',
  Aguardando: 'PENDING',
  Concluídos: 'COMPLETED',
  Expirados: 'EXPIRED',
};

export const MyCourses = () => {
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const isEmployee = auth?.user?.role === 'EMPLOYEE';
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Todos');

  const [courses, setCourses] = useState<StudentCourseCardResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coursesRef = useRef(courses);
  coursesRef.current = courses;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
    const statusParam = activeTab !== 'Todos' ? statusByTab[activeTab] : undefined;
    const cacheKey = resourceCacheKeys.studentEnrollments({
      query: debouncedSearchTerm || undefined,
      status: statusParam,
      page: 0,
      size: 10,
    });
    const cached = getCachedResource<{ content: StudentCourseCardResponse[]; hasMore: boolean }>(
      cacheKey,
    );
    setCourses(cached?.content ?? []);
    setHasMore(cached?.hasMore ?? false);
  }, [activeTab, debouncedSearchTerm]);

  const fetchCourses = useCallback(
    async (silent = false, isMounted: () => boolean = () => true) => {
      const statusParam = activeTab !== 'Todos' ? statusByTab[activeTab] : undefined;
      const params = {
        query: debouncedSearchTerm || undefined,
        status: statusParam,
        page,
        size: 10,
      };
      const cacheKey = resourceCacheKeys.studentEnrollments({ ...params, page: 0, size: 10 });

      if (!silent && isMounted()) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await getStudentEnrollments(params);
        if (!isMounted()) return;
        if (page === 0) {
          setCachedResource(cacheKey, {
            content: result.content,
            hasMore: result.pageNumber < result.totalPages - 1,
          });
          setCourses(result.content);
        } else {
          setCourses((prev) => [...prev, ...result.content]);
        }
        setHasMore(result.pageNumber < result.totalPages - 1);
        setError(null);
      } catch (err) {
        if (!isMounted()) return;
        if (page === 0 && coursesRef.current.length > 0) {
          setError(null);
          return;
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar cursos');
      } finally {
        if (isMounted()) setIsLoading(false);
      }
    },
    [activeTab, debouncedSearchTerm, page],
  );

  useEffect(() => {
    let mounted = true;
    void fetchCourses(false, () => mounted);
    return () => {
      mounted = false;
    };
  }, [fetchCourses]);

  useNetworkRecovery(() => {
    void fetchCourses(true);
  });

  const inProgressCourses = courses.filter((c) => c.enrollmentStatus === 'IN_PROGRESS');
  const pendingCourses = courses.filter((c) => c.enrollmentStatus === 'PENDING');
  const completedCourses = courses.filter((c) => c.enrollmentStatus === 'COMPLETED');
  const expiredCourses = courses.filter((c) => c.enrollmentStatus === 'EXPIRED');

  const handleCourseAction = async (courseId: string, status: EnrollmentStatus) => {
    if (status === 'COMPLETED') {
      const code = courses.find((c) => c.courseId === courseId)?.certificateCode;
      if (code) navigate(`/certificados/${code}`);
      return;
    }

    try {
      const curriculum = await getStudentCurriculum(courseId);
      const lessons = curriculum.modules.flatMap((module) => module.lessons);
      const next = lessons.find((lesson) => lesson.status === 'AVAILABLE') ?? lessons[0];
      if (next) navigate(`/aluno/cursos/${courseId}/aulas/${next.id}`);
    } catch {
      navigate(`/cursos/${courseId}`);
    }
  };

  const handleCourseRated = (courseId: string, rating: number) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.courseId === courseId ? { ...course, myRating: rating } : course,
      ),
    );
  };

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
          myRating={course.myRating}
          onAction={handleCourseAction}
          onRated={handleCourseRated}
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
          <PageHeader
            className={styles.titleSection}
            eyebrow={
              isEmployee ? 'Área do Colaborador • Meus Cursos' : 'Área do Aluno • Meus Cursos'
            }
            title="Meus Cursos"
            subtitle="Continue de onde você parou"
          />

          <div className={styles.controlsSection}>
            <div className={styles.searchContainer}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar em meus cursos"
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
            description={
              isEmployee
                ? 'Quando a sua empresa liberar cursos para você, eles aparecerão aqui.'
                : 'Não encontramos nenhum curso com os filtros atuais. Que tal explorar o catálogo?'
            }
            action={
              isEmployee ? undefined : (
                <Button
                  label="Explorar Catálogo"
                  variant="outlined"
                  onClick={() => navigate('/aluno/cursos')}
                />
              )
            }
          />
        ) : (
          <div className={styles.coursesContainer}>
            {activeTab === 'Todos' ? (
              <>
                {inProgressCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      <PlayCircle size={20} className={styles.icon} /> Em Andamento{' '}
                      <span className={styles.badge}>{inProgressCourses.length}</span>
                    </h2>
                    {renderCourseGrid(inProgressCourses)}
                  </section>
                )}

                {pendingCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      <Clock size={20} className={styles.icon} /> Aguardando Liberação{' '}
                      <span className={styles.badge}>{pendingCourses.length}</span>
                    </h2>
                    {renderCourseGrid(pendingCourses)}
                  </section>
                )}

                {completedCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      <CheckCircle size={20} className={styles.icon} /> Concluídos{' '}
                      <span className={styles.badge}>{completedCourses.length}</span>
                    </h2>
                    {renderCourseGrid(completedCourses)}
                  </section>
                )}

                {expiredCourses.length > 0 && (
                  <section className={styles.courseSection}>
                    <h2 className={styles.sectionTitle}>
                      <Ban size={20} className={styles.icon} /> Expirados{' '}
                      <span className={styles.badge}>{expiredCourses.length}</span>
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
