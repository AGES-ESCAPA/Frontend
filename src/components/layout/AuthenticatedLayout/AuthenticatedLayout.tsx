import type { ReactNode } from 'react';
import { Navbar } from '../Navbar/Navbar';
import { Sidebar } from '../Sidebar';
import type { SidebarMenuItem, SidebarRole, SidebarUser } from '../Sidebar';
import styles from './AuthenticatedLayout.module.css';

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
}: AuthenticatedLayoutProps) => (
  <div className={styles.layout}>
    <Sidebar role={role} items={items} user={user} onLogout={onLogout} />

    <div className={styles.content}>
      <Navbar
        state={role === 'company' ? 'company' : 'user'}
        user={{ name: user.name, role: user.role, avatarUrl: user.avatarUrl }}
        notificationsCount={notificationsCount}
      />

      <main className={styles.main}>{children}</main>
    </div>
  </div>
);
