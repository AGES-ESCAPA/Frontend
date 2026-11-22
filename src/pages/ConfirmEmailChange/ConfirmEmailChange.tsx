import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, PageHeader, Toast } from '@components/ui';
import { AuthServiceError, authService } from '@services/authService';
import styles from '@pages/CreatePassword/CreatePassword.module.css';

const TOKEN_ERROR_MESSAGES = {
  404: 'Este link é inválido ou já foi usado.',
  410: 'Este link expirou. Peça ao administrador para solicitar um novo e-mail.',
} as const;

type TokenErrorStatus = 404 | 410;

const NETWORK_ERROR_DESCRIPTION = 'Verifique sua conexão e tente novamente.';
const SERVER_ERROR_DESCRIPTION = 'Ocorreu um erro no servidor. Tente novamente em instantes.';

export const ConfirmEmailChange = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [details, setDetails] = useState<{
    name: string;
    currentEmail: string;
    newEmail: string;
  } | null>(null);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tokenErrorStatus, setTokenErrorStatus] = useState<TokenErrorStatus | null>(null);
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
        const result = await authService.getEmailChangeToken(token, controller.signal);
        if (cancelled) return;
        setDetails(result);
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

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setToastOpen(false);

    try {
      await authService.confirmEmailChange(token);
      navigate('/login', { replace: true, state: { emailChanged: true } });
    } catch (error: unknown) {
      if (!(error instanceof AuthServiceError)) {
        setToastDescription(NETWORK_ERROR_DESCRIPTION);
        setToastOpen(true);
      } else if (error.status === 404 || error.status === 410) {
        setTokenErrorStatus(error.status);
        setLoadStatus('error');
      } else {
        setToastDescription(SERVER_ERROR_DESCRIPTION);
        setToastOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  let content: ReactNode;
  if (tokenErrorStatus) {
    content = (
      <section className={styles.card} role="alert">
        <p className={styles.stateMessage}>{TOKEN_ERROR_MESSAGES[tokenErrorStatus]}</p>
        <Link to="/login" className={styles.stateLink}>
          Ir para o login
        </Link>
      </section>
    );
  } else if (loadStatus === 'error') {
    content = (
      <section className={styles.card} role="alert">
        <p className={styles.stateMessage}>Não foi possível validar este link.</p>
        <Link to="/login" className={styles.stateLink}>
          Ir para o login
        </Link>
      </section>
    );
  } else {
    content = (
      <>
        <p className={styles.subtitle} role={loadStatus === 'loading' ? 'status' : undefined}>
          {loadStatus === 'loading'
            ? 'Validando o link…'
            : details
              ? `Olá, ${details.name}. Confirme a alteração de ${details.currentEmail} para ${details.newEmail}.`
              : null}
        </p>
        {loadStatus === 'ready' && details ? (
          <section className={styles.card} aria-labelledby="confirm-email-title">
            <Button
              type="button"
              variant="primary"
              label="Confirmar novo e-mail"
              fullWidth
              className={styles.submit}
              isLoading={isSubmitting}
              onClick={() => {
                void handleConfirm();
              }}
            />
          </section>
        ) : null}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.panel}>
          <PageHeader
            title="Confirmar novo e-mail"
            titleId="confirm-email-title"
            className={styles.pageHeader}
          />
          {content}
        </div>
      </main>
      <Footer />

      <Toast
        open={toastOpen}
        variant="error"
        title="Não foi possível confirmar"
        description={toastDescription}
        onOpenChange={setToastOpen}
      />
    </div>
  );
};
