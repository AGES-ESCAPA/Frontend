import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import { useCheckoutAmount } from '@hooks/useCheckoutAmount';
import { PaymentPanel } from './components/PaymentPanel';
import type { PaymentSelection } from './components/PaymentPanel';
import styles from './Checkout.module.css';

export interface CheckoutProps {
  /**
   * Resumo do pedido (US-26, componente OrderSummary): fica na coluna da direita.
   * Sem ele, o pagamento ocupa a largura toda.
   */
  summary?: ReactNode;
  /** Disparado ao confirmar o pagamento; o que acontece depois dela é a US-27. */
  onConfirm?: (selection: PaymentSelection) => void;
}

// Usuário fixo enquanto não existe sessão (US-23), como nas demais telas autenticadas.
const usersByRole: Record<Exclude<SidebarRole, 'admin'>, SidebarUser> = {
  student: { name: 'Jorge Amado', role: 'Aluno', email: 'aluno@email.com' },
  company: { name: 'Escapa!', role: 'Empresa', email: 'escapa@email.com' },
};

const getRoleFromPathname = (pathname: string): Exclude<SidebarRole, 'admin'> =>
  pathname.startsWith('/empresa') ? 'company' : 'student';

export const Checkout = ({ summary, onConfirm }: CheckoutProps) => {
  const { pathname } = useLocation();
  const { courseId = '' } = useParams();
  const role = getRoleFromPathname(pathname);
  const { amount, status, errorMessage } = useCheckoutAmount(courseId);

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
          <PaymentPanel amount={amount} onConfirm={handleConfirm} />
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
