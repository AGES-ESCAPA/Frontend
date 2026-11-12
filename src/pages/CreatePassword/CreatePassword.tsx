import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, FormField, PasswordInput, Toast } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { useAccountInvite } from '@hooks/useAccountInvite';
import type { AccountInviteErrorStatus } from '@hooks/useAccountInvite';
import { AuthServiceError, authService } from '@services/authService';
import {
  INVITE_PASSWORD_INITIAL_VALUES,
  hasInvitePasswordErrors,
  validateInvitePassword,
} from '@utils/invitePassword';
import type { InvitePasswordErrors, InvitePasswordField, InvitePasswordValues } from '@/types/auth';
import styles from './CreatePassword.module.css';

const MY_COURSES_ROUTE = '/meus-cursos';

const PASSWORD_PLACEHOLDER = '••••••••';

const INVITE_ERROR_MESSAGES = {
  404: 'Este link é inválido ou já foi usado',
  410: 'Este link expirou. Peça ao gestor da sua empresa um novo convite.',
} as const;

export const CreatePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { login } = useAuth();
  const { invite, status, errorStatus } = useAccountInvite(token);
  const [values, setValues] = useState<InvitePasswordValues>(INVITE_PASSWORD_INITIAL_VALUES);
  const [errors, setErrors] = useState<InvitePasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorStatus, setSubmitErrorStatus] = useState<AccountInviteErrorStatus>(null);
  const [toastOpen, setToastOpen] = useState(false);

  // O convite pode deixar de valer entre abrir a tela e enviar a senha.
  const inviteErrorStatus = submitErrorStatus ?? (status === 'error' ? errorStatus : null);

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
      const session = await authService.createInvitePassword(token, values.password);
      login(session.token, session.user, session.expiresIn);
      navigate(MY_COURSES_ROUTE, { replace: true });
    } catch (error: unknown) {
      if (error instanceof AuthServiceError && (error.status === 404 || error.status === 410)) {
        setSubmitErrorStatus(error.status);
      } else {
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
    if (inviteErrorStatus !== null) {
      return (
        <section className={styles.card} role="alert">
          <p className={styles.stateMessage}>{INVITE_ERROR_MESSAGES[inviteErrorStatus]}</p>
          {inviteErrorStatus === 404 ? (
            <Link to="/login" className={styles.stateLink}>
              Ir para o login
            </Link>
          ) : null}
        </section>
      );
    }

    if (status === 'error') {
      return (
        <section className={styles.card} role="alert">
          <p className={styles.stateMessage}>
            Não foi possível carregar o convite. Verifique sua conexão e tente novamente.
          </p>
        </section>
      );
    }

    // Enquanto o convite carrega a tela já aparece inteira, com os campos bloqueados.
    const isLoading = status === 'loading' || invite === null;

    return (
      <>
        {invite === null ? (
          <p className={styles.subtitle} role="status" aria-label="Carregando convite">
            &nbsp;
          </p>
        ) : (
          <p className={styles.subtitle}>
            {invite.companyName} - {invite.email}
          </p>
        )}

        <form
          className={styles.card}
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="create-password-title"
          aria-busy={isLoading || isSubmitting}
        >
          <FormField label="Nova senha" htmlFor="create-password" error={errors.password}>
            <PasswordInput
              id="create-password"
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
            htmlFor="create-password-confirmation"
            error={errors.passwordConfirmation}
          >
            <PasswordInput
              id="create-password-confirmation"
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
            label="Criar"
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
          <h1 className={styles.title} id="create-password-title">
            Crie sua senha
          </h1>
          {renderContent()}
        </div>
      </main>
      <Footer variant="compact" />
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant="error"
        title="Não foi possível criar a senha"
        description="Verifique sua conexão e tente novamente."
      />
    </div>
  );
};
