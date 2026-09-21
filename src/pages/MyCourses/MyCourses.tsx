import styles from './MyCourses.module.css';
import { useState, useMemo } from 'react';
import { mockCourses } from './mockCourses';

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
          <h1>My Courses</h1>
          <p>Continue where you left off</p>
          <p>Cursos encontrados: {filteredCourses.length}</p>
        </section>
      </main>
    </div>
  );
};
