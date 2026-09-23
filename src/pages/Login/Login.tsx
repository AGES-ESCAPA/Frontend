import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui';
import { useAuth } from '../../hooks/useAuth';
import escapaLogo from '@assets/escapa_logo.png';
import styles from './Login.module.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('linked_student_v1@escapa.com');
  const [password, setPassword] = useState('123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await login(email, password);
      if (profile.role === 'ADMIN') {
        navigate('/admin/cursos');
      } else {
        navigate('/meus-cursos');
      }
    } catch (err) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
        <p className={styles.subtitle}>Plataforma de cursos</p>

        <form onSubmit={handleLogin} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Digite seu e-mail"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Sua senha"
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <Button
            type="submit"
            variant="primary"
            label={isLoading ? 'Entrando...' : 'Entrar'}
            className={styles.cta}
            disabled={isLoading}
          />
        </form>

        <div className={styles.divider}>
          <span>Ou acesse diretamente (Fallback)</span>
        </div>

        <div className={styles.ctaGroup} aria-label="Escolha seu perfil">
          <Button
            type="button"
            variant="outlined"
            label="Aluno"
            className={styles.cta}
            onClick={() => navigate('/meus-cursos')}
          />
          <Button
            type="button"
            variant="outlined"
            label="Admin"
            className={styles.cta}
            onClick={() => navigate('/admin/cursos')}
          />
        </div>
      </main>
    </div>
  );
};
