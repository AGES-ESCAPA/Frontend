import { Link } from 'react-router-dom';
import { Button } from '@components/ui';
import { setMockUserRole } from '@services/mockAuthService';
import escapaLogo from '@assets/escapa_logo.png';
import styles from './Login.module.css';

/*Associa cada perfil demo à sua página inicial e ao papel validado nas rotas*/
const profiles = [
  { label: 'Aluno', to: '/aluno/cursos', role: 'student' },
  { label: 'Admin', to: '/admin/cursos', role: 'admin' },
  { label: 'Empresa', to: '/empresa/cursos', role: 'company' },
] as const;

export const Login = () => {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
        <p className={styles.subtitle}>Plataforma de cursos</p>

        {/* Persiste a escolha do perfil para a guarda validar a navegação demo*/}
        <div className={styles.ctaGroup} aria-label="Escolha seu perfil">
          {profiles.map((profile) => (
            <Button
              key={profile.to}
              asChild
              variant="primary"
              label={profile.label}
              className={styles.cta}
              onClick={() => setMockUserRole(profile.role)}
            >
              <Link to={profile.to} />
            </Button>
          ))}
        </div>
      </main>
    </div>
  );
};
