import type { ReactNode } from 'react';
import { Navbar } from '../Navbar/Navbar';
import { Sidebar } from '../Sidebar';
import type { SidebarMenuItem, SidebarRole, SidebarUser } from '../Sidebar';
import { useOptionalAuth } from '@contexts/useAuth';
import styles from './AuthenticatedLayout.module.css';

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    COMPANY: 'Empresa',
    STUDENT: 'Aluno',
    EMPLOYEE: 'Colaborador',
  };

  return labels[role] ?? role;
};

export interface AuthenticatedLayoutProps {
  /** Perfil do usuário logado — define a variante da Sidebar e da Navbar. */
  role: SidebarRole;
  /** Itens do menu lateral, já com a seção atual marcada como `active`. */
  items: SidebarMenuItem[];
  user: SidebarUser;
  notificationsCount?: number;
  onLogout?: () => void;
  /** Conteúdo da tela, renderizado dentro do `<main>` da casca. */
  children: ReactNode;
}

/**
 * Casca das telas pós-login: Sidebar fixa, Navbar e a área de conteúdo.
 *
 * A largura do conteúdo acompanha a Sidebar em tempo real através de
 * `data-collapsed`, que fica `false` tanto quando ela é fixada aberta quanto
 * quando expande apenas no hover ou no foco.
 */
export const AuthenticatedLayout = ({
  role,
  items,
  user,
  notificationsCount,
  onLogout,
  children,
}: AuthenticatedLayoutProps) => {
  const auth = useOptionalAuth();
  const sessionUser = auth?.user;
  const resolvedUser: SidebarUser = sessionUser
    ? {
        name: sessionUser.name,
        role: getRoleLabel(sessionUser.role),
        email: sessionUser.email,
        avatarUrl: sessionUser.avatarUrl ?? undefined,
      }
    : user;
  const resolvedLogout = sessionUser ? auth.logout : onLogout;

  return (
    <div className={styles.layout}>
      <Sidebar role={role} items={items} user={resolvedUser} onLogout={resolvedLogout} />

      <div className={styles.content}>
        <Navbar
          state={role === 'company' ? 'company' : 'user'}
          user={{
            name: resolvedUser.name,
            role: resolvedUser.role,
            avatarUrl: resolvedUser.avatarUrl,
          }}
          notificationsCount={notificationsCount}
          collapsible={role !== 'student'}
          onLogout={resolvedLogout}
          profileHref={role === 'company' ? '/empresa/perfil' : '/meu-perfil'}
          showProfileLink={role !== 'admin'}
        />

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};
