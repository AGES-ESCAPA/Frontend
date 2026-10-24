import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@components/layout';
import { useCheckoutCourse } from '@hooks/useCheckoutCourse';
import { useCheckoutLayout } from '@hooks/useCheckoutLayout';
import { OrderServiceError, createOrder } from '@services/orderService';
import type { OrderConfirmationState } from '@/types/order';
import { OrderSummary } from '@components/ui/OrderSummary/OrderSummary';
import { PaymentPanel } from './components/PaymentPanel';
import type { PaymentSelection } from './components/PaymentPanel';
import styles from './Checkout.module.css';

export interface CheckoutProps {
  summary?: ReactNode;
}

const SUBMIT_ERROR_MESSAGE = 'Não foi possível concluir a compra. Tente novamente em instantes.';

export const Checkout = ({ summary }: CheckoutProps) => {
  const navigate = useNavigate();
  const { courseId = '' } = useParams();
  const { role, menuItems, user, catalogPath } = useCheckoutLayout();
  const { course, status, errorMessage, retry } = useCheckoutCourse(courseId);
  const amount = course?.price ?? null;
  const courseTitle = course?.title ?? null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const confirmationPath =
    role === 'company' ? '/empresa/checkout/confirmacao' : '/checkout/confirmacao';

  const handleLogout = () => {
    window.location.assign('/');
  };

  /**
   * Registra a compra: a API aprova o pedido e libera o acesso na hora. Em seguida a tela de
   * confirmação substitui o checkout no histórico, para o "voltar" não reabrir o formulário e
   * permitir pagar duas vezes.
   */
  const handleConfirm = async (selection: PaymentSelection) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await createOrder({
        itemType: 'COURSE',
        courseId,
        paymentMethod: selection.paymentMethod,
        installments: selection.installments,
      });
      const confirmation: OrderConfirmationState = { order, itemTitle: courseTitle };
      navigate(confirmationPath, { replace: true, state: confirmation });
    } catch (error: unknown) {
      setSubmitError(error instanceof OrderServiceError ? error.message : SUBMIT_ERROR_MESSAGE);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthenticatedLayout
      role={role}
      items={menuItems}
      user={user}
      notificationsCount={2}
      onLogout={handleLogout}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Pagamento</p>
        <h1 className={styles.title}>Finalizar Compra</h1>
      </header>

      {status === 'loading' && (
        <div className={`${styles.grid} ${styles.withSummary}`}>
          <p className={styles.status} role="status">
            Carregando os dados da compra...
          </p>

          <aside className={styles.summary} aria-label="Resumo do pedido">
            {summary ?? <OrderSummary status="loading" />}
          </aside>
        </div>
      )}

      {(status === 'error' || status === 'not-found') && (
        <section className={styles.error} role="alert">
          <p>
            {status === 'not-found'
              ? 'Curso não encontrado.'
              : (errorMessage ?? 'Não foi possível carregar os dados da compra.')}
          </p>

          {status === 'error' && (
            <button type="button" onClick={retry}>
              Tentar novamente
            </button>
          )}

          <Link to={catalogPath} className={styles.catalogLink}>
            Voltar ao catálogo
          </Link>
        </section>
      )}

      {status === 'success' && amount !== null && (
        <div className={summary ? `${styles.grid} ${styles.withSummary}` : styles.grid}>
          <PaymentPanel
            amount={amount}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
            onConfirm={(selection) => void handleConfirm(selection)}
          />
          {summary ? (
            <aside className={styles.summary} aria-label="Resumo do pedido">
              {summary}
            </aside>
          ) : null}
        </div>
      )}
    </AuthenticatedLayout>
  );
};
