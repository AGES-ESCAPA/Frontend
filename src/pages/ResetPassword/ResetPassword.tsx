import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, FormField, PasswordInput, Toast } from '@components/ui';
import { AuthServiceError, authService } from '@services/authService';
import {
  INVITE_PASSWORD_INITIAL_VALUES,
  hasInvitePasswordErrors,
  validateInvitePassword,
} from '@utils/invitePassword';
import type { InvitePasswordErrors, InvitePasswordField, InvitePasswordValues } from '@/types/auth';
import styles from '@pages/CreatePassword/CreatePassword.module.css';

const PASSWORD_PLACEHOLDER = '••••••••';

const TOKEN_ERROR_MESSAGES = {
  404: 'Este link é inválido ou já foi usado.',
  410: 'Este link expirou. Solicite um novo em “Esqueci minha senha”.',
} as const;

type TokenErrorStatus = 404 | 410;

const PASSWORD_REJECTED_MESSAGE = 'A senha não foi aceita. Use pelo menos 8 caracteres.';
const NETWORK_ERROR_DESCRIPTION = 'Verifique sua conexão e tente novamente.';
const SERVER_ERROR_DESCRIPTION = 'Ocorreu um erro no servidor. Tente novamente em instantes.';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [email, setEmail] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tokenErrorStatus, setTokenErrorStatus] = useState<TokenErrorStatus | null>(null);
  const [values, setValues] = useState<InvitePasswordValues>(INVITE_PASSWORD_INITIAL_VALUES);
  const [errors, setErrors] = useState<InvitePasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastDescription, setToastDescription] = useState(NETWORK_ERROR_DESCRIPTION);

  useEffect(() => {
    if (!token) {
      setLoadStatus('error');
      setTokenErrorStatus(404);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadToken = async () => {
      setLoadStatus('loading');
      setTokenErrorStatus(null);

      try {
        const details = await authService.getPasswordResetToken(token, controller.signal);
        if (cancelled) return;
        setEmail(details.email);
        setLoadStatus('ready');
      } catch (error: unknown) {
        if (cancelled) return;
        if (error instanceof AuthServiceError && (error.status === 404 || error.status === 410)) {
          setTokenErrorStatus(error.status);
          setLoadStatus('error');
          return;
        }
        setLoadStatus('error');
      }
    };

    void loadToken();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token]);

  const changeField = (field: InvitePasswordField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] === undefined ? current : { ...current, [field]: undefined },
    );
  };

  const submitPassword = async () => {
    const validationErrors = validateInvitePassword(values);
    setErrors(validationErrors);
    setToastOpen(false);

    if (hasInvitePasswordErrors(validationErrors)) return;

    setIsSubmitting(true);

    try {
      await authService.resetPassword(token, values.password);
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (error: unknown) {
      if (!(error instanceof AuthServiceError)) {
        setToastDescription(NETWORK_ERROR_DESCRIPTION);
        setToastOpen(true);
      } else if (error.status === 404 || error.status === 410) {
        setTokenErrorStatus(error.status);
        setLoadStatus('error');
      } else if (error.status === 400 || error.status === 422) {
        setErrors({ password: PASSWORD_REJECTED_MESSAGE });
      } else {
        setToastDescription(SERVER_ERROR_DESCRIPTION);
        setToastOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    void submitPassword();
  };

  const renderContent = () => {
    if (tokenErrorStatus !== null) {
      return (
        <section className={styles.card} role="alert">
          <p className={styles.stateMessage}>{TOKEN_ERROR_MESSAGES[tokenErrorStatus]}</p>
          <Link to="/esqueci-minha-senha" className={styles.stateLink}>
            Solicitar novo link
          </Link>
          <Link to="/login" className={styles.stateLink}>
            Ir para o login
          </Link>
        </section>
      );
    }

    if (loadStatus === 'error') {
      return (
        <section className={styles.card} role="alert">
          <p className={styles.stateMessage}>
            Não foi possível validar o link. Verifique sua conexão e tente novamente.
          </p>
          <Link to="/esqueci-minha-senha" className={styles.stateLink}>
            Solicitar novo link
          </Link>
        </section>
      );
    }

    const isLoading = loadStatus === 'loading';

    return (
      <>
        <p className={styles.subtitle} role={isLoading ? 'status' : undefined}>
          {isLoading ? '\u00A0' : email}
        </p>

        <form
          className={styles.card}
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="reset-password-title"
          aria-busy={isLoading || isSubmitting}
        >
          <FormField label="Nova senha" htmlFor="reset-password" error={errors.password}>
            <PasswordInput
              id="reset-password"
              className={styles.fieldInput}
              placeholder={PASSWORD_PLACEHOLDER}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => changeField('password', event.target.value)}
              disabled={isLoading || isSubmitting}
              invalid={errors.password !== undefined}
              required
            />
          </FormField>

          <FormField
            label="Confirmar senha"
            htmlFor="reset-password-confirmation"
            error={errors.passwordConfirmation}
          >
            <PasswordInput
              id="reset-password-confirmation"
              className={styles.fieldInput}
              placeholder={PASSWORD_PLACEHOLDER}
              autoComplete="new-password"
              value={values.passwordConfirmation}
              onChange={(event) => changeField('passwordConfirmation', event.target.value)}
              disabled={isLoading || isSubmitting}
              invalid={errors.passwordConfirmation !== undefined}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            label="Redefinir senha"
            fullWidth
            isLoading={isSubmitting}
            disabled={isLoading}
            className={styles.submit}
          />
        </form>
      </>
    );
  };

  return (
    <div className={styles.page}>
      <Navbar state="register" />
      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.title} id="reset-password-title">
            Redefinir senha
          </h1>
          {renderContent()}
        </div>
      </main>
      <Footer variant="compact" />
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant="error"
        title="Não foi possível redefinir a senha"
        description={toastDescription}
      />
    </div>
  );
};
