import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@components/layout';
import { useCheckoutAmount } from '@hooks/useCheckoutAmount';
import { useCheckoutLayout } from '@hooks/useCheckoutLayout';
import { OrderServiceError, createOrder } from '@services/orderService';
import type { OrderConfirmationState } from '@/types/order';
import { PaymentPanel } from './components/PaymentPanel';
import type { PaymentSelection } from './components/PaymentPanel';
import styles from './Checkout.module.css';

export interface CheckoutProps {
  /**
   * Resumo do pedido (US-26, componente OrderSummary): fica na coluna da direita.
   * Sem ele, o pagamento ocupa a largura toda.
   */
  summary?: ReactNode;
}

const SUBMIT_ERROR_MESSAGE = 'Não foi possível concluir a compra. Tente novamente em instantes.';

export const Checkout = ({ summary }: CheckoutProps) => {
  const navigate = useNavigate();
  const { courseId = '' } = useParams();
  const { role, menuItems, user, catalogPath } = useCheckoutLayout();
  const { amount, courseTitle, status, errorMessage } = useCheckoutAmount(courseId);
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
        <p className={styles.status} role="status">
          Carregando os dados da compra...
        </p>
      )}

      {status === 'error' && (
        <section className={styles.error} role="alert">
          <p>{errorMessage ?? 'Não foi possível carregar os dados da compra.'}</p>
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
