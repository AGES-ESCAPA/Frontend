import { useState } from 'react';
import type { AnchorHTMLAttributes, FocusEvent, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import escapaIcone from '@assets/escapa_icone.png';
import escapaLogo from '@assets/escapa_logo.png';
import { Avatar, Button } from '@components/ui';
import { SIDEBAR_ICON_SIZE, SIDEBAR_ROLE_LABELS } from './sidebarMenuPresets';
import styles from './Sidebar.module.css';

/** Perfis de usuário que definem o conjunto padrão de itens do menu. */
export type SidebarRole = 'student' | 'company' | 'admin';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"]';

/** Props recebidas pelo componente de link dos itens de menu. */
export type SidebarLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
};

/** Componente usado para renderizar cada item do menu como link de navegação. */
export type SidebarLinkComponent = (props: SidebarLinkProps) => ReactNode;

export interface SidebarMenuItem {
  /** Ícone Lucide exibido à esquerda do label. */
  icon: ReactNode;
  /** Texto do item de menu. */
  label: string;
  /** Rota de destino (prop `to` do componente de link). */
  route: string;
  /** Marca o item como a seção atual (variante `active` do Button). */
  active?: boolean;
}

export interface SidebarUser {
  /** Nome completo exibido no rodapé. */
  name: string;
  /** Label do perfil exibido abaixo do nome (ex.: "Aluno", "Empresa"). */
  role: string;
  /** E-mail exibido abaixo do nome, conforme a referência visual. */
  email?: string;
  /** URL da foto de perfil. Sem ela, o Avatar cai nas iniciais do nome. */
  avatarUrl?: string;
}

export interface SidebarProps {
  /** Perfil do usuário logado — identifica a variante da Sidebar. */
  role: SidebarRole;
  /** Itens do menu relevantes ao perfil. */
  items: SidebarMenuItem[];
  /** Dados do usuário exibidos no rodapé. */
  user: SidebarUser;
  /** Versão recolhida: apenas ícones, sem labels e sem os textos do rodapé. */
  collapsed?: boolean;
  /** Quando fornecido, exibe o botão de sair no rodapé. */
  onLogout?: () => void;
  /**
   * Componente de link dos itens de menu. Por padrão usa o `Link` do
   * react-router-dom (navegação client-side); pode ser substituído em
   * contextos sem Router ou por outra biblioteca de roteamento.
   */
  linkComponent?: SidebarLinkComponent;
}

/**
 * Sidebar — menu lateral fixo das telas internas (pós-login).
 *
 * Utiliza `Button` (variantes `ghost-dark` e `active`) para os itens de menu e
 * `Avatar` para a identificação do usuário no rodapé — não reimplementa
 * nenhum dos dois, seguindo o mesmo princípio da `Navbar`.
 *
 * Cada item de menu é um link de navegação client-side (`Link` do
 * react-router-dom por padrão, substituível via `linkComponent`) renderizado
 * pelo próprio `Button` com `asChild`.
 *
 * Com a prop `collapsed`, o estado vem do componente pai; sem ela, a Sidebar
 * fica recolhida em repouso, expande no hover ou no foco e trava aberta com um
 * duplo clique fora dos botões.
 *
 * A largura reduzida dispara a container query do `Button`, que esconde os
 * labels e mantém só os ícones (o `aria-label` continua descrevendo cada item).
 */
export const Sidebar = ({
  role,
  items,
  user,
  collapsed,
  onLogout,
  linkComponent: LinkComponent = Link,
}: SidebarProps) => {
  const roleLabel = SIDEBAR_ROLE_LABELS[role];
  const isAutoResponsive = collapsed === undefined;

  const [isPinned, setIsPinned] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [hasFocusInside, setHasFocusInside] = useState(false);

  const isOpen = isPinned || isPointerInside || hasFocusInside;
  const isCollapsed = isAutoResponsive ? !isOpen : collapsed;
  const isPinnedOpen = isAutoResponsive ? isPinned : !collapsed;

  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (!isAutoResponsive) return;
    if ((event.target as Element).closest(INTERACTIVE_SELECTOR)) return;

    setIsPinned((pinned) => !pinned);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    setHasFocusInside(false);
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      data-role={role}
      data-collapsed={isCollapsed}
      data-pinned={isPinnedOpen}
      data-auto-responsive={isAutoResponsive}
      aria-label={`Menu lateral — ${roleLabel}`}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsPointerInside(true)}
      onMouseLeave={() => setIsPointerInside(false)}
      onFocus={() => setHasFocusInside(true)}
      onBlur={handleBlur}
    >
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <img src={escapaLogo} alt="escapa!" className={styles.logo} />
            <img src={escapaIcone} alt="" aria-hidden="true" className={styles.logoIcon} />
            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.brandSuffix}>Cursos</span>
          </div>
          <p className={styles.roleLabel}>{roleLabel}</p>
        </div>
      </header>

      <nav className={styles.nav} aria-label={`Navegação do perfil ${roleLabel}`}>
        <ul className={styles.menuList}>
          {items.map((item) => (
            <li key={item.route} className={styles.menuItem}>
              <Button
                asChild
                fullWidth
                label={item.label}
                icon={item.icon}
                variant={item.active ? 'active' : 'ghost-dark'}
                className={styles.menuButton}
                aria-current={item.active ? 'page' : undefined}
              >
                <LinkComponent to={item.route} />
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {isAutoResponsive && isPointerInside ? (
        <p className={styles.pinHint}>
          {isPinned
            ? 'Clique duas vezes para soltar a barra'
            : 'Clique duas vezes para travar a barra aberta'}
        </p>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.userInfo}>
          <Avatar name={user.name} imageUrl={user.avatarUrl} theme="dark" />
          <div className={styles.userText}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{user.email ?? user.role}</span>
          </div>
        </div>

        {onLogout ? (
          <button
            type="button"
            className={styles.logoutButton}
            onClick={onLogout}
            aria-label="Sair da conta"
          >
            <LogOut size={SIDEBAR_ICON_SIZE} aria-hidden="true" />
          </button>
        ) : null}
      </footer>
    </aside>
  );
};
