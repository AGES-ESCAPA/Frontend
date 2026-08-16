import styles from './Home.module.css';

export const Home = () => {
  return (
    <main className={styles.container}>
      <h1 className={styles.brand}>escapa!</h1>
      <p className={styles.subtitle}>Plataforma de cursos</p>
      <a href="/login" className={styles.cta} aria-label="Acessar a plataforma">
        Acessar plataforma
      </a>
    </main>
  );
};
