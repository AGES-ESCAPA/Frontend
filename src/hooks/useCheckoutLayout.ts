import { useLocation } from 'react-router-dom';
import { SIDEBAR_MENU_PRESETS, SIDEBAR_ROLE_LABELS } from '@components/layout';
import type { SidebarMenuItem, SidebarRole, SidebarUser } from '@components/layout';
import { useOptionalAuth } from '@contexts/useAuth';

export type CheckoutRole = Exclude<SidebarRole, 'admin'>;

export interface CheckoutLayout {
  role: CheckoutRole;
  menuItems: SidebarMenuItem[];
  user: SidebarUser;
  /** Catálogo de cursos do perfil, para onde o usuário volta de um erro ou conclui a compra. */
  catalogPath: string;
}

// Usuário de exemplo para quando a tela é aberta fora de uma sessão (ex.: testes e demonstrações).
const fallbackUsers: Record<CheckoutRole, SidebarUser> = {
  student: { name: 'Jorge Amado', role: 'Aluno', email: 'aluno@email.com' },
  company: { name: 'Escapa!', role: 'Empresa', email: 'escapa@email.com' },
};

/** As rotas da empresa começam com /empresa; o resto do checkout é do aluno. */
export const getCheckoutRole = (pathname: string): CheckoutRole =>
  pathname.startsWith('/empresa') ? 'company' : 'student';

/**
 * Casca das telas do checkout (pagamento e confirmação): perfil pela rota, menu com "Cursos"
 * ativo e o usuário da sessão, quando há uma.
 */
export const useCheckoutLayout = (): CheckoutLayout => {
  const { pathname } = useLocation();
  const sessionUser = useOptionalAuth()?.user ?? null;
  const role = getCheckoutRole(pathname);

  const menuItems = SIDEBAR_MENU_PRESETS[role].map((item, index) => ({
    ...item,
    active: index === 0,
  }));

  const user: SidebarUser = sessionUser
    ? {
        name: sessionUser.name,
        role: SIDEBAR_ROLE_LABELS[role],
        email: sessionUser.email,
        ...(sessionUser.avatarUrl ? { avatarUrl: sessionUser.avatarUrl } : {}),
      }
    : fallbackUsers[role];

  return {
    role,
    menuItems,
    user,
    catalogPath: role === 'company' ? '/empresa/cursos' : '/aluno/cursos',
  };
};
