import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, FormField, PasswordInput } from '@components/ui';
import { companyEmployeeService } from '@services/companyEmployeeService';
import styles from './EmployeeInvitation.module.css';

export const EmployeeInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('O link do convite está incompleto ou inválido.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmation) {
      setErrorMessage('As senhas não correspondem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await companyEmployeeService.completeInvitation({ token, password });
      setIsComplete(true);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível concluir o convite.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar state="register" />
      <main className={styles.main}>
        <section className={styles.panel} aria-labelledby="invitation-title">
          <h1 id="invitation-title" className={styles.title}>
            {isComplete ? 'Acesso ativado' : 'Ative seu acesso'}
          </h1>
          {isComplete ? (
            <div className={styles.card}>
              <p role="status">Sua senha foi criada e o acesso está ativo.</p>
              <Link to="/login">Ir para o login</Link>
            </div>
          ) : (
            <form className={styles.card} onSubmit={handleSubmit} noValidate>
              <p>Crie uma senha para concluir seu cadastro de colaborador.</p>
              {!token ? (
                <p className={styles.error} role="alert">
                  O link do convite está incompleto ou inválido.
                </p>
              ) : null}
              <FormField label="Nova senha" htmlFor="employee-invitation-password">
                <PasswordInput
                  id="employee-invitation-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </FormField>
              <FormField label="Confirme a senha" htmlFor="employee-invitation-confirmation">
                <PasswordInput
                  id="employee-invitation-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </FormField>
              {errorMessage ? (
                <p className={styles.error} role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button
                type="submit"
                label="Ativar acesso"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={!token}
              />
            </form>
          )}
        </section>
      </main>
      <Footer variant="compact" />
    </div>
  );
};
