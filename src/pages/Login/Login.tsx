import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, PasswordInput } from '@components/ui';
import escapaLogo from '@assets/escapa_logo.png';
import styles from './Login.module.css';

const profiles = [
  { label: 'Aluno', to: '/aluno/cursos' },
  { label: 'Admin', to: '/admin/cursos' },
  { label: 'Empresa', to: '/empresa/cursos' },
] as const;

export const Login = () => {
  const [password, setPassword] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
        <p className={styles.subtitle}>Plataforma de cursos</p>

        <section className={styles.demoSection} aria-label="Campo de senha">
          <div className={styles.labelRow}>
            <label htmlFor="login-password" className={styles.inputLabel}>
              SENHA
            </label>
            <a href="#recuperar-senha" className={styles.forgotPassword}>
              Esqueci minha senha
            </a>
          </div>

          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            invalid={isInvalid}
          />

          <label className={styles.toggleInvalid}>
            <input
              type="checkbox"
              checked={isInvalid}
              onChange={(e) => setIsInvalid(e.target.checked)}
            />
            <span>Simular estado inválido (erro)</span>
          </label>
        </section>

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
