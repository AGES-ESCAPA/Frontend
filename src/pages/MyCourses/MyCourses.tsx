import { useState, useMemo } from 'react';
import { FilterTabs, SearchBar, StudentCourseCard } from '@components/ui';
import styles from './MyCourses.module.css';
import { mockCourses } from './mockCourses';

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
    <div className={styles.container}>
      <aside className={styles.mockSidebar}>
        <p>Sidebar Placeholder</p>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.mockNavbar}>
          <p>Navbar Placeholder</p>
        </header>

        <section className={styles.pageContent}>
          <div className={styles.headerArea}>
            <h1>Meus Cursos</h1>
            <p>Continue de onde você parou</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.tabScroller}>
              <FilterTabs
                options={tabOptions}
                selected={activeTab}
                onChange={(value) => setActiveTab(value as TabType)}
                groupLabel="Filtrar cursos por status"
              />
            </div>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              aria-label="Buscar meus cursos"
            />
          </div>

          {filteredCourses.length === 0 ? (
            <div className={styles.emptyState}>Nenhum curso encontrado com estes filtros.</div>
          ) : (
            <div className={styles.coursesContainer}>
              {activeTab === 'Todos' ? (
                <>
                  {inProgressCourses.length > 0 && (
                    <section className={styles.courseSection}>
                      <h2 className={styles.sectionTitle}>Em Andamento 🔄</h2>
                      {renderCourseGrid(inProgressCourses)}
                    </section>
                  )}

                  {pendingCourses.length > 0 && (
                    <section className={styles.courseSection}>
                      <h2 className={styles.sectionTitle}>Aguardando Liberação ⏳</h2>
                      {renderCourseGrid(pendingCourses)}
                    </section>
                  )}

                  {completedCourses.length > 0 && (
                    <section className={styles.courseSection}>
                      <h2 className={styles.sectionTitle}>Concluídos ✅</h2>
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
      </main>
    </div>
  );
};
