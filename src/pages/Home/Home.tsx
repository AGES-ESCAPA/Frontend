import escapaLogo from '@assets/escapa_logo.png';
import { Footer } from '@components/layout';
import styles from './Home.module.css';

export const Home = () => {
  return (
    <>
      <main className={styles.container}>
        <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
        <p className={styles.subtitle}>Plataforma de cursos</p>
        <div className={styles.ctaGroup} aria-label="Escolha seu perfil">
          <a href="/courses?role=admin" className={styles.cta}>
            Admin
          </a>
          <a href="/courses?role=company" className={styles.cta}>
            Empresa
          </a>
          <a href="/courses?role=student" className={styles.cta}>
            Aluno
          </a>
        </div>
        <a href="/cursos/ia-aplicada-ao-turismo" className={styles.courseLink}>
          Ver detalhes do curso
        </a>
      </main>
      <Footer variant="full" />
    </>
  );
};
