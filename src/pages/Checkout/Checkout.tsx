import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import { useCheckoutCourse } from '@hooks/useCheckoutCourse';
import { OrderSummary } from '@components/ui/OrderSummary/OrderSummary';
import { PaymentPanel } from './components/PaymentPanel';
import type { PaymentSelection } from './components/PaymentPanel';
import styles from './Checkout.module.css';

export interface CheckoutProps {
  summary?: ReactNode;
  onConfirm?: (selection: PaymentSelection) => void;
}

// Temporário: substituir pela sessão real após integração da US-23.
const usersByRole: Record<Exclude<SidebarRole, 'admin'>, SidebarUser> = {
  student: {
    name: 'Jorge Amado',
    role: 'Aluno',
    email: 'aluno@email.com',
  },
  company: {
    name: 'Escapa!',
    role: 'Empresa',
    email: 'escapa@email.com',
  },
};

const getRoleFromPathname = (pathname: string): Exclude<SidebarRole, 'admin'> =>
  pathname.startsWith('/empresa') ? 'company' : 'student';

export const Checkout = ({ summary, onConfirm }: CheckoutProps) => {
  const { pathname } = useLocation();
  const { courseId = '' } = useParams();

  const role = getRoleFromPathname(pathname);
  const { course, status, errorMessage, retry } = useCheckoutCourse(courseId);

  const amount = course?.price;

  const menuItems = SIDEBAR_MENU_PRESETS[role].map((item, index) => ({
    ...item,
    active: index === 0,
  }));

  const catalogPath = role === 'company' ? '/empresa/cursos' : '/aluno/cursos';

  const handleLogout = () => {
    window.location.assign('/');
  };

  const handleConfirm = (selection: PaymentSelection) => {
    onConfirm?.(selection);
  };

  return (
    <AuthenticatedLayout
      role={role}
      items={menuItems}
      user={usersByRole[role]}
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

      {status === 'success' && course && amount !== null && amount !== undefined && (
        <div className={`${styles.grid} ${styles.withSummary}`}>
          <PaymentPanel amount={amount} onConfirm={handleConfirm} />

          <aside className={styles.summary} aria-label="Resumo do pedido">
            {summary ?? (
              <OrderSummary
                item={{
                  kind: 'course',
                  title: course.title,
                  imageUrl: course.thumbnailUrl ?? '',
                  duration:
                    course.durationTime === null
                      ? 'Duração não informada'
                      : `${course.durationTime} horas`,
                  price: amount,
                }}
                paymentMethod="Cartão de crédito"
              />
            )}
          </aside>
        </div>
      )}
    </AuthenticatedLayout>
  );
};
