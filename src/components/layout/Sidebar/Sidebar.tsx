import { useEffect, useId, useRef, useState } from 'react';
import type { AnchorHTMLAttributes, FocusEvent, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import escapaIcone from '@assets/escapa_icone.png';
import escapaLogo from '@assets/escapa_logo.png';
import { Button } from '@components/ui';
import { SIDEBAR_ICON_SIZE, SIDEBAR_ROLE_LABELS } from './sidebarMenuPresets';
import styles from './Sidebar.module.css';

/** Perfis de usuário que definem o conjunto padrão de itens do menu. */
export type SidebarRole = 'student' | 'company' | 'admin';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"]';
/** Drawer abaixo de 768px — alinhado ao P0-3 e à especificação. */
const DRAWER_MEDIA_QUERY = '(max-width: 47.999rem)';
/** Sidebar expandida por padrão a partir de 1024px (Admin/Empresa). */
const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';
/** Mantém o pin ao remontar a Sidebar (ex.: fundo do detalhe do curso). */
const SIDEBAR_PINNED_KEY_PREFIX = 'escapa.sidebar.pinned.';

const matchesMedia = (query: string) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;

const readPinnedPreference = (role: SidebarRole): boolean => {
  try {
    const raw = sessionStorage.getItem(`${SIDEBAR_PINNED_KEY_PREFIX}${role}`);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    // Storage indisponível: cai no padrão abaixo.
  }

  // Aluno: recolhida até hover/pin. Admin/Empresa: expandida no desktop.
  if (role === 'student') return false;
  return matchesMedia(DESKTOP_MEDIA_QUERY);
};

const writePinnedPreference = (role: SidebarRole, pinned: boolean) => {
  try {
    sessionStorage.setItem(`${SIDEBAR_PINNED_KEY_PREFIX}${role}`, pinned ? '1' : '0');
  } catch {
    // Storage indisponível (modo privado etc.): o pin só vale nesta montagem.
  }
};

/** Props recebidas pelo componente de link dos itens de menu. */
export type SidebarLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
};

/** Componente usado para renderizar cada item de menu como link de navegação. */
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
  /**
   * Rótulo exibido sob o logo (ex.: Colaborador). Sem isso, usa o padrão do
   * perfil (`SIDEBAR_ROLE_LABELS`).
   */
  roleLabel?: string;
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
 * Utiliza `Button` (variantes `ghost-dark` e `active`) para os itens de menu.
 * O rodapé mostra nome/e-mail do usuário e o botão de sair.
 *
 * Cada item de menu é um link de navegação client-side (`Link` do
 * react-router-dom por padrão, substituível via `linkComponent`) renderizado
 * pelo próprio `Button` com `asChild`.
 *
 * Com a prop `collapsed`, o estado vem do componente pai. Sem ela:
 * - **&lt; 768px:** drawer com hambúrguer (todos os perfis).
 * - **Aluno (≥ 768px):** recolhida em repouso; expande no hover/foco; pin com duplo clique.
 * - **Admin/Empresa (768–1023px):** rail de ícones com tooltip (sem depender de hover).
 * - **Admin/Empresa (≥ 1024px):** expandida por padrão, com botão explícito de recolher.
 *
 * A largura reduzida dispara a container query do `Button`, que esconde os
 * labels e mantém só os ícones (o `aria-label` continua descrevendo cada item).
 */
export const Sidebar = ({
  role,
  items,
  user,
  roleLabel: roleLabelProp,
  collapsed,
  onLogout,
  linkComponent: LinkComponent = Link,
}: SidebarProps) => {
  const roleLabel = roleLabelProp ?? SIDEBAR_ROLE_LABELS[role];
  const isAutoResponsive = collapsed === undefined;
  const usesExplicitCollapse = role !== 'student';
  const sidebarId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  const [isPinned, setIsPinned] = useState(() => readPinnedPreference(role));
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [hasFocusInside, setHasFocusInside] = useState(false);
  const [isDrawerViewport, setIsDrawerViewport] = useState(() => matchesMedia(DRAWER_MEDIA_QUERY));
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    matchesMedia(DESKTOP_MEDIA_QUERY),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDrawerMode = isDrawerViewport;
  const isTabletRail = usesExplicitCollapse && !isDrawerViewport && !isDesktopViewport;

  useEffect(() => {
    setIsPinned(readPinnedPreference(role));
  }, [role]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const drawerMedia = window.matchMedia(DRAWER_MEDIA_QUERY);
    const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const sync = () => {
      const drawer = drawerMedia.matches;
      const desktop = desktopMedia.matches;
      setIsDrawerViewport(drawer);
      setIsDesktopViewport(desktop);
      if (!drawer) setMobileOpen(false);

      // Ao entrar no desktop sem preferência salva, Admin/Empresa começam expandidos.
      if (usesExplicitCollapse && desktop) {
        try {
          if (sessionStorage.getItem(`${SIDEBAR_PINNED_KEY_PREFIX}${role}`) === null) {
            setIsPinned(true);
          }
        } catch {
          setIsPinned(true);
        }
      }
    };

    sync();
    drawerMedia.addEventListener('change', sync);
    desktopMedia.addEventListener('change', sync);

    return () => {
      drawerMedia.removeEventListener('change', sync);
      desktopMedia.removeEventListener('change', sync);
    };
  }, [role, usesExplicitCollapse]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setMobileOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  const hoverExpands = isAutoResponsive && role === 'student' && !isDrawerMode;
  const isOpen = isPinned || (hoverExpands && (isPointerInside || hasFocusInside));

  let isCollapsed = isAutoResponsive ? !isOpen : Boolean(collapsed);
  if (isDrawerMode) isCollapsed = false;
  if (isAutoResponsive && isTabletRail) isCollapsed = true;

  const isPinnedOpen = isAutoResponsive ? isPinned : !collapsed;
  const showCollapseToggle =
    isAutoResponsive && usesExplicitCollapse && !isDrawerMode && isDesktopViewport;

  const setPinned = (pinned: boolean) => {
    setIsPinned(pinned);
    writePinnedPreference(role, pinned);
  };

  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    // Admin/Empresa usam o botão explícito; só o aluno mantém o duplo clique.
    if (!isAutoResponsive || isDrawerMode || usesExplicitCollapse) return;
    if ((event.target as Element).closest(INTERACTIVE_SELECTOR)) return;

    setPinned(!isPinned);
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    setHasFocusInside(false);
  };

  return (
    <>
      {isDrawerMode ? (
        <button
          ref={toggleRef}
          type="button"
          className={styles.mobileToggle}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
          aria-controls={sidebarId}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      ) : null}

      {isDrawerMode && mobileOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Fechar menu lateral"
          tabIndex={-1}
          onClick={closeMobileMenu}
        />
      ) : null}

      <aside
        id={sidebarId}
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
        data-role={role}
        data-collapsed={isCollapsed}
        data-pinned={isPinnedOpen}
        data-auto-responsive={isAutoResponsive}
        data-mobile-open={isDrawerMode ? mobileOpen : undefined}
        aria-hidden={isDrawerMode && !mobileOpen ? true : undefined}
        aria-label={`Menu lateral — ${roleLabel}`}
        onClick={(event) => {
          if (!isDrawerMode || !mobileOpen) return;
          if ((event.target as Element).closest('a, button')) closeMobileMenu();
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => {
          if (hoverExpands) setIsPointerInside(true);
        }}
        onMouseLeave={() => {
          if (hoverExpands) setIsPointerInside(false);
        }}
        onFocus={() => {
          if (hoverExpands) setHasFocusInside(true);
        }}
        onBlur={handleBlur}
      >
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src={escapaLogo} alt="ESCAPA Academy" className={styles.logo} />
            <img src={escapaIcone} alt="" aria-hidden="true" className={styles.logoIcon} />
          </div>

          {showCollapseToggle ? (
            <button
              type="button"
              className={styles.collapseToggle}
              aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              aria-expanded={!isCollapsed}
              onClick={() => setPinned(isCollapsed)}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={18} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={18} aria-hidden="true" />
              )}
            </button>
          ) : null}
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
                  title={isCollapsed ? item.label : undefined}
                >
                  <LinkComponent to={item.route} />
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {isAutoResponsive && hoverExpands && isPointerInside ? (
          <p className={styles.pinHint}>
            {isPinned
              ? 'Clique duas vezes para soltar a barra'
              : 'Clique duas vezes para travar a barra aberta'}
          </p>
        ) : null}

        <footer className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.userText}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole} title={user.email ?? user.role}>
                {user.email ?? user.role}
              </span>
            </div>
          </div>

          {onLogout ? (
            <button
              type="button"
              className={styles.logoutButton}
              onClick={onLogout}
              aria-label="Sair da conta"
              title={isCollapsed ? 'Sair da conta' : undefined}
            >
              <LogOut size={SIDEBAR_ICON_SIZE} aria-hidden="true" />
            </button>
          ) : null}
        </footer>
      </aside>
    </>
  );
};
