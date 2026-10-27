import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, FormField, PasswordInput, TextInput, Toast } from '@components/ui';
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
      <Navbar state="register" />
      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.title}>Painel de login</h1>
          <form className={styles.card} onSubmit={handleSubmit} noValidate>
            <FormField label="E-mail" htmlFor="login-email">
              <TextInput
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@escapa.com.br"
                icon={<Mail size={18} aria-hidden="true" />}
                className={styles.fieldInput}
                autoComplete="email"
                disabled={isSubmitting}
                invalid={formError !== null}
                required
              />
            </FormField>
            <FormField
              label="Senha"
              htmlFor="login-password"
              labelAction={
                <Link className={styles.forgot} to="/esqueci-minha-senha">
                  Esqueci minha senha
                </Link>
              }
            >
              <PasswordInput
                id="login-password"
                className={styles.fieldInput}
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
              className={styles.submit}
            />
            <p className={styles.signup}>
              <span>
                novo por aqui? <Link to={authPath('/cadastro', returnTo)}>Criar conta</Link>
              </span>
            </p>
          </form>
        </div>
      </main>
      <Footer variant="compact" />
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
