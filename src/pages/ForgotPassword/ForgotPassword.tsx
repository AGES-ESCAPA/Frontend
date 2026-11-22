import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, FormField, TextInput, Toast } from '@components/ui';
import { AuthServiceError, authService } from '@services/authService';
import styles from './ForgotPassword.module.css';

const SUCCESS_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Verifique sua caixa de entrada.';

const NETWORK_ERROR_DESCRIPTION = 'Verifique sua conexão e tente novamente.';
const SERVER_ERROR_DESCRIPTION = 'Ocorreu um erro no servidor. Tente novamente em instantes.';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastDescription, setToastDescription] = useState(NETWORK_ERROR_DESCRIPTION);

  const submitRequest = async () => {
    if (isSubmitting) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Informe o e-mail da sua conta.');
      return;
    }

    setEmailError(null);
    setToastOpen(false);
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(trimmed);
      setSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof AuthServiceError && (error.status === 400 || error.status === 422)) {
        setEmailError('Informe um e-mail válido.');
      } else if (error instanceof AuthServiceError && error.status >= 500) {
        setToastDescription(SERVER_ERROR_DESCRIPTION);
        setToastOpen(true);
      } else {
        setToastDescription(NETWORK_ERROR_DESCRIPTION);
        setToastOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitRequest();
  };

  return (
    <div className={styles.page}>
      <Navbar state="register" />
      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.title}>Esqueci minha senha</h1>

          {submitted ? (
            <section className={styles.card} role="status">
              <p className={styles.message}>{SUCCESS_MESSAGE}</p>
              <Link className={styles.link} to="/login">
                Voltar para o login
              </Link>
            </section>
          ) : (
            <form className={styles.card} onSubmit={handleSubmit} noValidate>
              <p className={styles.hint}>
                Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para
                redefinir a senha.
              </p>
              <FormField
                label="E-mail"
                htmlFor="forgot-password-email"
                error={emailError ?? undefined}
              >
                <TextInput
                  id="forgot-password-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="email@escapa.com.br"
                  icon={<Mail size={18} aria-hidden="true" />}
                  className={styles.fieldInput}
                  autoComplete="email"
                  disabled={isSubmitting}
                  invalid={emailError !== null}
                  required
                />
              </FormField>
              <Button
                type="submit"
                variant="primary"
                label="Enviar link"
                fullWidth
                isLoading={isSubmitting}
                className={styles.submit}
              />
              <p className={styles.footerText}>
                Lembrou a senha? <Link to="/login">Entrar</Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer variant="compact" />
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant="error"
        title="Não foi possível enviar o link"
        description={toastDescription}
        actionLabel="Tentar novamente"
        onAction={() => void submitRequest()}
      />
    </div>
  );
};
