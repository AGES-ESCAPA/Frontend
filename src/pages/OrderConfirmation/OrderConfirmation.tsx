import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@components/layout';
import { Badge, Button } from '@components/ui';
import { useCheckoutLayout } from '@hooks/useCheckoutLayout';
import type { CheckoutRole } from '@hooks/useCheckoutLayout';
import { getCourseAccessPath } from '@utils/courseAccess';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import type { OrderConfirmationState, PaymentMethod, PlacedOrder } from '@/types/order';
import styles from './OrderConfirmation.module.css';

const COMPANY_COLLABORATORS_PATH = '/empresa/colaboradores';
const STUDENT_COURSES_PATH = '/meus-cursos';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: 'Cartão de crédito',
  PIX: 'PIX',
  BOLETO: 'Boleto',
};

/** O estado vem da navegação: sem ele (acesso direto ou recarregar a página) não há o que confirmar. */
const isConfirmationState = (state: unknown): state is OrderConfirmationState => {
  if (typeof state !== 'object' || state === null || !('order' in state)) return false;

  const { order } = state as { order: Partial<PlacedOrder> | null };
  return (
    typeof order === 'object' &&
    order !== null &&
    typeof order.orderId === 'string' &&
    order.status === 'APPROVED' &&
    typeof order.amount === 'number'
  );
};

const formatPaymentMethod = (order: PlacedOrder): string => {
  const label = PAYMENT_METHOD_LABELS[order.paymentMethod];
  return order.installments > 1 ? `${label} em ${order.installments}x` : `${label} à vista`;
};

const formatItem = (order: PlacedOrder, itemTitle: string | null | undefined): string => {
  if (order.itemType === 'SEATS') {
    const seats = order.seatsQuantity ?? 0;
    return `Pacote de ${seats} ${seats === 1 ? 'assento corporativo' : 'assentos corporativos'}`;
  }
  return itemTitle ?? 'Curso';
};

const describeAccess = (role: CheckoutRole, order: PlacedOrder): string => {
  if (order.itemType === 'SEATS') {
    return 'Os assentos foram adicionados à sua empresa. Eles não liberam cursos: servem para cadastrar novos colaboradores.';
  }
  return role === 'company'
    ? 'O curso foi adicionado ao catálogo da sua empresa.'
    : 'Seu acesso ao curso já está liberado. Você pode começar a estudar agora.';
};

/**
 * Tela de confirmação da compra (US-27). O pedido já foi aprovado e o acesso liberado quando ela
 * abre; o botão leva a quem comprou ao lugar certo: o curso, o catálogo da empresa ou a gestão de
 * colaboradores.
 */
export const OrderConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { role, menuItems, user, catalogPath } = useCheckoutLayout();
  const [isOpeningCourse, setIsOpeningCourse] = useState(false);

  const handleLogout = () => {
    window.location.assign('/');
  };

  if (!isConfirmationState(state)) {
    return <Navigate to={role === 'company' ? catalogPath : STUDENT_COURSES_PATH} replace />;
  }

  const { order, itemTitle } = state;

  const handleOpenCourse = async () => {
    if (!order.courseId) return;

    setIsOpeningCourse(true);
    navigate(await getCourseAccessPath(order.courseId));
  };

  const renderActions = () => {
    if (order.itemType === 'SEATS') {
      return (
        <Button asChild variant="primary" label="Ir para colaboradores">
          <Link to={COMPANY_COLLABORATORS_PATH} />
        </Button>
      );
    }

    if (role === 'company') {
      return (
        <Button asChild variant="primary" label="Ver catálogo de cursos">
          <Link to={catalogPath} />
        </Button>
      );
    }

    return (
      <>
        <Button
          variant="primary"
          label="Acessar curso"
          isLoading={isOpeningCourse}
          onClick={() => void handleOpenCourse()}
        />
        <Button asChild variant="outlined" label="Ver meus cursos">
          <Link to={STUDENT_COURSES_PATH} />
        </Button>
      </>
    );
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
        <h1 className={styles.title}>Compra aprovada!</h1>
      </header>

      <section className={styles.card} aria-labelledby="order-confirmation-heading">
        <div className={styles.success}>
          <CircleCheck className={styles.successIcon} size={48} aria-hidden="true" />
          <div>
            <h2 id="order-confirmation-heading" className={styles.successTitle}>
              Pagamento confirmado
            </h2>
            <p className={styles.successText}>{describeAccess(role, order)}</p>
          </div>
        </div>

        <dl className={styles.details}>
          <div className={styles.row}>
            <dt>Pedido</dt>
            <dd>{`#${order.orderId.slice(0, 8).toUpperCase()}`}</dd>
          </div>
          <div className={styles.row}>
            <dt>{order.itemType === 'SEATS' ? 'Pacote' : 'Curso'}</dt>
            <dd>{formatItem(order, itemTitle)}</dd>
          </div>
          <div className={styles.row}>
            <dt>Forma de pagamento</dt>
            <dd>{formatPaymentMethod(order)}</dd>
          </div>
          <div className={styles.row}>
            <dt>Data</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div className={styles.row}>
            <dt>Status</dt>
            <dd>
              <Badge variant="success" label="Aprovado" />
            </dd>
          </div>
          <div className={`${styles.row} ${styles.total}`}>
            <dt>Total</dt>
            <dd>{formatCurrency(order.amount)}</dd>
          </div>
        </dl>

        <div className={styles.actions}>{renderActions()}</div>
      </section>
    </AuthenticatedLayout>
  );
};
