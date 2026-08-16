import escapaLogo from '@assets/escapa_logo.png';
import styles from './Home.module.css';

export const Home = () => {
  return (
    <main className={styles.container}>
      <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
      <p className={styles.subtitle}>Plataforma de cursos</p>
      <a href="/login" className={styles.cta} aria-label="Acessar a plataforma">
        Acessar plataforma
      </a>
    </main>
  );
};
