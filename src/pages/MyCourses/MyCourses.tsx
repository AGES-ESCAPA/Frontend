import { useState, useMemo } from 'react';
import styles from './MyCourses.module.css';
import { mockCourses } from './mockCourses';
import { MyCourseCard } from '../../components/ui/MyCourseCard/MyCourseCard';

export type TabType = 'Todos' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED';

export const MyCourses = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab, setActiveTab] = useState<TabType>('Todos');

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesTab = activeTab === 'Todos' || course.status === activeTab;
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const inProgressCourses = filteredCourses.filter((c) => c.status === 'IN_PROGRESS');
  const pendingCourses = filteredCourses.filter((c) => c.status === 'PENDING');
  const completedCourses = filteredCourses.filter((c) => c.status === 'COMPLETED');

  const renderCourseGrid = (courses: typeof mockCourses) => (
    <div className={styles.courseGrid}>
      {courses.map((course) => (
        <MyCourseCard key={course.id} course={course} />
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
