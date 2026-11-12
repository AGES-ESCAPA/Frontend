import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, FormField, PasswordInput } from '@components/ui';
import { companyEmployeeService } from '@services/companyEmployeeService';
import type { EmployeeInvitation } from '@services/companyEmployeeService';
import styles from './AcceptEmployeeInvitation.module.css';

type LoadStatus = 'loading' | 'success' | 'error';

export const AcceptEmployeeInvitation = () => {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') ?? '';
  const [invitation, setInvitation] = useState<EmployeeInvitation | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const passwordId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (!token) {
      setLoadError('O link do convite está incompleto.');
      setLoadStatus('error');
      return;
    }

    const controller = new AbortController();
    setLoadStatus('loading');
    companyEmployeeService
      .getInvitation(token, controller.signal)
      .then((data) => {
        setInvitation(data);
        setLoadStatus('success');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : 'Não foi possível validar o convite.',
        );
        setLoadStatus('error');
      });

    return () => controller.abort();
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPasswordError =
      password.length < 8 ? 'A senha deve ter pelo menos 8 caracteres.' : null;
    const nextConfirmError = confirmPassword !== password ? 'As senhas precisam ser iguais.' : null;
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setSubmitError(null);
    if (nextPasswordError || nextConfirmError || !token) return;

    setIsSubmitting(true);
    try {
      await companyEmployeeService.completeInvitation({ token, password });
      setCompleted(true);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível criar a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="invitation-title">
          <p className={styles.eyebrow}>Acesso corporativo</p>
          <h1 id="invitation-title">{completed ? 'Acesso ativado' : 'Crie sua senha'}</h1>

          {loadStatus === 'loading' ? <p role="status">Validando seu convite...</p> : null}

          {loadStatus === 'error' ? (
            <div role="alert" className={styles.error}>
              <p>{loadError}</p>
              <Link to="/login">Ir para o login</Link>
            </div>
          ) : null}

          {loadStatus === 'success' && invitation && !completed ? (
            <>
              <p className={styles.description}>
                Olá, <strong>{invitation.name}</strong>. Crie uma senha para acessar os cursos de{' '}
                {invitation.companyName}.
              </p>
              <p className={styles.email}>{invitation.email}</p>
              <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
                <FormField
                  label="Nova senha"
                  htmlFor={passwordId}
                  required
                  error={passwordError ?? undefined}
                >
                  <PasswordInput
                    id={passwordId}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                    invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? `${passwordId}-error` : undefined}
                  />
                </FormField>
                <FormField
                  label="Confirme a senha"
                  htmlFor={confirmId}
                  required
                  error={confirmError ?? undefined}
                >
                  <PasswordInput
                    id={confirmId}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={isSubmitting}
                    invalid={Boolean(confirmError)}
                    aria-describedby={confirmError ? `${confirmId}-error` : undefined}
                  />
                </FormField>
                {submitError ? (
                  <p role="alert" className={styles.error}>
                    {submitError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  label="Criar senha e ativar acesso"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                />
              </form>
            </>
          ) : null}

          {completed ? (
            <div className={styles.success}>
              <p>
                Sua senha foi criada e sua conta está ativa. Agora você já pode acessar os cursos.
              </p>
              <Link to="/login" className={styles.loginLink}>
                Ir para o login
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};
