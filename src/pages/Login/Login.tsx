import { Link } from 'react-router-dom';
import { Button } from '@components/ui';
import escapaLogo from '@assets/escapa_logo.png';
import styles from './Login.module.css';

const profiles = [
  { label: 'Estudante', to: '/courses?role=student' },
  { label: 'Admin', to: '/courses?role=admin' },
  { label: 'Empresa', to: '/courses?role=company' },
] as const;

export const Login = () => {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
        <p className={styles.subtitle}>Plataforma de cursos</p>
        <div className={styles.ctaGroup} aria-label="Escolha seu perfil">
          {profiles.map((profile) => (
            <Button
              key={profile.to}
              asChild
              variant="primary"
              label={profile.label}
              className={styles.cta}
            >
              <Link to={profile.to} />
            </Button>
          ))}
        </div>
      </main>
    </div>
  );
};
