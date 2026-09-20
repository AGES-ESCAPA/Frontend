import styles from './MyCourses.module.css';

export const MyCourses = () => {
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
        </section>
      </main>
    </div>
  );
};
