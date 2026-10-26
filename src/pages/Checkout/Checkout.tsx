import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@components/layout';
import { Button, OrderSummary, Toast } from '@components/ui';
import type { OrderBuyer, OrderItem } from '@components/ui';
import { useCheckoutCourse } from '@hooks/useCheckoutCourse';
import { useCheckoutLayout } from '@hooks/useCheckoutLayout';
import type { CheckoutRole } from '@hooks/useCheckoutLayout';
import { useProfile } from '@hooks/useProfile';
import { useSeatPrice } from '@hooks/useSeatPrice';
import { useToast } from '@hooks/useToast';
import { OrderServiceError, createOrder } from '@services/orderService';
import type { CreateOrderPayload, OrderConfirmationState } from '@/types/order';
import type { UserProfile } from '@/types/profile';
import { getCourseAccessPath } from '@utils/courseAccess';
import { formatWorkload } from '@utils/formatters';
import { PaymentPanel } from './components/PaymentPanel';
import type { PaymentSelection } from './components/PaymentPanel';
import styles from './Checkout.module.css';

export interface CheckoutProps {
  /** O que está sendo comprado: um curso (`/checkout/:courseId`) ou assentos (`?quantidade=N`). */
  kind?: 'course' | 'seats';
  summary?: ReactNode;
  onConfirm?: (selection: PaymentSelection) => void;
}

/**
 * Máximo de parcelas do cartão. Nenhuma US define o número: fica aqui, e o CreditCardForm já
 * recebe o limite por prop, então mudar o parcelamento não mexe no formulário.
 */
export const CHECKOUT_MAX_INSTALLMENTS = 12;

const SUBMIT_ERROR_MESSAGE = 'Não foi possível concluir a compra. Tente novamente em instantes.';
const ALREADY_ACTIVE_STATUS = 409;

/** "?quantidade=10" vira 10; ausente, zero, negativo ou fracionado não é uma quantidade válida. */
const parseSeatsQuantity = (value: string | null): number | null =>
  value !== null && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;

/** Dados do comprador vindos do perfil (US-24): aluno com CPF, empresa com razão social e CNPJ. */
const toBuyer = (profile: UserProfile | null, role: CheckoutRole): OrderBuyer | undefined => {
  if (!profile) return undefined;
  if (role === 'company') {
    return {
      kind: 'company',
      name: profile.companyName ?? profile.name,
      email: profile.email,
      document: profile.cnpj ?? '',
    };
  }
  return {
    kind: 'individual',
    name: profile.name,
    email: profile.email,
    document: profile.cpf ?? '',
  };
};

export const Checkout = ({ kind = 'course', summary, onConfirm }: CheckoutProps) => {
  const navigate = useNavigate();
  const isSeats = kind === 'seats';
  const { courseId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const seatsQuantity = isSeats ? parseSeatsQuantity(searchParams.get('quantidade')) : null;

  const { role, menuItems, user, catalogPath } = useCheckoutLayout();
  const courseState = useCheckoutCourse(isSeats ? '' : courseId);
  const seatState = useSeatPrice(isSeats && seatsQuantity !== null);
  const { profile } = useProfile();
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyActive, setAlreadyActive] = useState(false);

  const { course } = courseState;
  const status = isSeats
    ? seatsQuantity === null
      ? 'invalid-seats'
      : seatState.status
    : courseState.status;
  const errorMessage = isSeats ? seatState.errorMessage : courseState.errorMessage;
  const retry = isSeats ? seatState.retry : courseState.retry;

  const amount = isSeats
    ? seatState.seatPrice !== null && seatsQuantity !== null
      ? seatState.seatPrice * seatsQuantity
      : null
    : course
      ? (course.price ?? 0)
      : null;

  const item: OrderItem | undefined =
    isSeats && seatsQuantity !== null && amount !== null
      ? { kind: 'seats', quantity: seatsQuantity, total: amount }
      : course && amount !== null
        ? {
            kind: 'course',
            title: course.title,
            imageUrl: course.thumbnailUrl ?? '',
            duration: formatWorkload(course.durationTime ?? null),
            price: amount,
          }
        : undefined;

  const confirmationPath =
    role === 'company' ? '/empresa/checkout/confirmacao' : '/checkout/confirmacao';

  const handleLogout = () => {
    window.location.assign('/');
  };

  const openPurchasedCourse = async () => {
    navigate(await getCourseAccessPath(courseId));
  };

  /**
   * Registra a compra: a API aprova o pedido e libera o acesso na hora. Em seguida a tela de
   * confirmação substitui o checkout no histórico, para o "voltar" não reabrir o formulário e
   * permitir pagar duas vezes.
   */
  const handleConfirm = async (selection: PaymentSelection) => {
    if (isSubmitting) return;

    onConfirm?.(selection);
    setIsSubmitting(true);
    setSubmitError(null);
    setAlreadyActive(false);
    dismissToast();

    const payload: CreateOrderPayload = isSeats
      ? {
          itemType: 'SEATS',
          seatsQuantity: seatsQuantity ?? 0,
          paymentMethod: selection.paymentMethod,
          installments: selection.installments,
        }
      : {
          itemType: 'COURSE',
          courseId,
          paymentMethod: selection.paymentMethod,
          installments: selection.installments,
        };

    try {
      const order = await createOrder(payload);
      const confirmation: OrderConfirmationState = { order, itemTitle: course?.title ?? null };
      navigate(confirmationPath, { replace: true, state: confirmation });
    } catch (error: unknown) {
      const message = error instanceof OrderServiceError ? error.message : SUBMIT_ERROR_MESSAGE;
      if (error instanceof OrderServiceError && error.status === ALREADY_ACTIVE_STATUS) {
        // Curso já ativo: não adianta tentar de novo, o caminho é abrir o curso.
        setSubmitError(message);
        setAlreadyActive(true);
      } else {
        // Os dados do cartão continuam no formulário: "Tentar novamente" reenvia a mesma escolha.
        showToast('error', 'Não foi possível concluir a compra', message, {
          label: 'Tentar novamente',
          onAction: () => void handleConfirm(selection),
        });
      }
      setIsSubmitting(false);
    }
  };

  const alreadyActiveAction = !alreadyActive ? undefined : role === 'company' ? (
    <Link to={catalogPath}>Ver catálogo da empresa</Link>
  ) : (
    <button type="button" onClick={() => void openPurchasedCourse()}>
      Ir para o curso
    </button>
  );

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

      {(status === 'error' || status === 'not-found' || status === 'invalid-seats') && (
        <section className={styles.error} role="alert">
          <p>
            {status === 'not-found'
              ? 'Curso não encontrado.'
              : status === 'invalid-seats'
                ? 'Informe uma quantidade de assentos válida.'
                : (errorMessage ?? 'Não foi possível carregar os dados da compra.')}
          </p>

          {status === 'error' && (
            <Button variant="outlined" label="Tentar novamente" onClick={retry} />
          )}

          <Link to={catalogPath} className={styles.catalogLink}>
            Voltar ao catálogo
          </Link>
        </section>
      )}

      {status === 'success' && amount !== null && (
        <div className={`${styles.grid} ${styles.withSummary}`}>
          <PaymentPanel
            amount={amount}
            maxInstallments={CHECKOUT_MAX_INSTALLMENTS}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
            errorAction={alreadyActiveAction}
            onConfirm={(selection) => void handleConfirm(selection)}
          />
          <aside className={styles.summary} aria-label="Resumo do pedido">
            {summary ?? (
              <OrderSummary
                item={item}
                buyer={toBuyer(profile, role)}
                paymentMethod="Cartão de Crédito"
              />
            )}
          </aside>
        </div>
      )}

      {toast && (
        <Toast
          key={toast.key}
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          actionLabel={toast.action?.label}
          onAction={toast.action?.onAction}
          // Com "Tentar novamente", o aviso só fecha pela pessoa: sumir sozinho tiraria a ação dela.
          duration={toast.action ? Infinity : undefined}
        />
      )}
    </AuthenticatedLayout>
  );
};
