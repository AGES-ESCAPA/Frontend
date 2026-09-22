import { useState, useMemo } from 'react';
import { FilterTabs, SearchBar, StudentCourseCard, EmptyState, Button } from '@components/ui';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout/AuthenticatedLayout';
import { SIDEBAR_MENU_PRESETS } from '../../components/layout/Sidebar/sidebarMenuPresets';
import styles from './MyCourses.module.css';
import { mockCourses, mockUser } from './mockCourses';

export type TabType = 'Todos' | 'Em andamento' | 'Aguardando' | 'Concluídos';

const tabOptions: TabType[] = ['Todos', 'Em andamento', 'Aguardando', 'Concluídos'];
const statusByTab = {
  'Em andamento': 'IN_PROGRESS',
  Aguardando: 'PENDING',
  Concluídos: 'COMPLETED',
} as const;

export const MyCourses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Todos');

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesTab =
        activeTab === 'Todos' || course.enrollmentStatus === statusByTab[activeTab];
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const inProgressCourses = filteredCourses.filter((c) => c.enrollmentStatus === 'IN_PROGRESS');
  const pendingCourses = filteredCourses.filter((c) => c.enrollmentStatus === 'PENDING');
  const completedCourses = filteredCourses.filter((c) => c.enrollmentStatus === 'COMPLETED');

  const renderCourseGrid = (courses: typeof mockCourses) => (
    <div className={styles.courseGrid}>
      {courses.map((course) => (
        <StudentCourseCard key={course.courseId} {...course} />
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

        {filteredCourses.length === 0 ? (
          <EmptyState
            title="Nenhum curso encontrado"
            description="Não encontramos nenhum curso com os filtros atuais. Que tal explorar o catálogo?"
            action={<Button onClick={() => {}}>Explorar Catálogo</Button>}
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
              </>
            ) : (
              <section className={styles.courseSection}>
                {renderCourseGrid(filteredCourses)}
              </section>
            )}
          </div>
        )}
      </section>
    </AuthenticatedLayout>
  );
};
