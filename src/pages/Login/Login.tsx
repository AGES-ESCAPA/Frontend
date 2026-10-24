import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, FormField, PasswordInput, TextInput, Toast } from '@components/ui';
import escapaLogo from '@assets/escapa_logo.png';
import { useAuth } from '@contexts/useAuth';
import { AuthServiceError, authService } from '@services/authService';
import { getDefaultRoute, getPostLoginDestination } from '@routes/access';
import { authPath, getAuthReturnTo } from '@utils/authReturnTo';
import styles from './Login.module.css';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isRestoring, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const hasStartedLogin = useRef(false);

  if (isRestoring)
    return <div className={styles.page} role="status" aria-label="Restaurando sessão" />;
  if (user && !hasStartedLogin.current) return <Navigate to={getDefaultRoute(user.role)} replace />;

  const returnTo = getAuthReturnTo(location.state, location.search);

  const submitLogin = async () => {
    if (isSubmitting) return;

    setFormError(null);
    setToastOpen(false);
    setIsSubmitting(true);
    hasStartedLogin.current = true;

    try {
      const session = await authService.login(email, password);
      login(session.token, session.user, session.expiresIn);
      navigate(getPostLoginDestination(session.user.role, returnTo), { replace: true });
    } catch (error: unknown) {
      hasStartedLogin.current = false;
      if (error instanceof AuthServiceError && error.status === 401) {
        setFormError('E-mail ou senha incorretos.');
      } else if (error instanceof AuthServiceError && error.status === 403) {
        setFormError('Esta conta está desativada. Entre em contato com o suporte.');
      } else {
        setToastOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitLogin();
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <img src={escapaLogo} alt="escapa! - Plataforma de Cursos" className={styles.logo} />
        <p className={styles.subtitle}>Plataforma de cursos</p>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField label="E-mail" htmlFor="login-email" required>
            <TextInput
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={isSubmitting}
              invalid={formError !== null}
              required
            />
          </FormField>
          <FormField label="Senha" htmlFor="login-password" required>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              invalid={formError !== null}
              required
            />
          </FormField>
          {formError ? (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            label="Entrar"
            fullWidth
            isLoading={isSubmitting}
          />
        </form>
        <div className={styles.links}>
          <Link to="/esqueci-minha-senha">Esqueci minha senha</Link>
          <Link to={authPath('/cadastro', returnTo)}>Criar uma conta</Link>
        </div>
      </main>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant="error"
        title="Não foi possível entrar"
        description="Verifique sua conexão e tente novamente."
        actionLabel="Tentar novamente"
        onAction={() => void submitLogin()}
      />
    </div>
  );
};
