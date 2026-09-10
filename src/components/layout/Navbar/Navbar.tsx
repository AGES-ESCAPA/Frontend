import { useEffect, useId, useRef, useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { Avatar, Button } from '@components/ui';
import logo from '@assets/escapa_logo.png';
import styles from './Navbar.module.css';

export type NavbarState = 'noAuth' | 'register' | 'user' | 'company';

export interface NavbarUser {
  name: string;
  role: string;
  avatarUrl?: string;
}

export type NavbarProps =
  | {
      state: 'noAuth' | 'register';
      user?: never;
      notificationsCount?: number;
    }
  | {
      state: 'user' | 'company';
      user: NavbarUser;
      notificationsCount?: number;
    };

export const Navbar = ({ state, user, notificationsCount = 0 }: NavbarProps) => {
  const isProfile = state === 'user' || state === 'company';
  const hasMenu = state === 'noAuth' || isProfile;
  const badgeLabel = notificationsCount > 99 ? '99+' : String(notificationsCount);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <nav ref={navRef} className={styles.navbar} aria-label="Navegação principal" data-state={state}>
      {!isProfile && (
        <div className={styles.leftGroup}>
          <a href="/" className={styles.brand} aria-label="Página inicial">
            <img src={logo} alt="escapa!" />
          </a>
          <span className={styles.context}>cursos</span>
        </div>
      )}

      {hasMenu && (
        <div className={styles.actions}>
          {/* Ponto de entrada principal — sempre visível, nunca colapsa */}
          {state === 'noAuth' && (
            <Button
              asChild
              variant="ghost"
              label="Entrar"
              className={`${styles.primaryEntry} ${styles.navButton}`}
            >
              <a href="/login" aria-label="Acessar a plataforma" />
            </Button>
          )}

          {(state === 'user' || state === 'company') && (
            <div
              id={menuId}
              className={styles.cluster}
              data-open={menuOpen}
              onClick={() => setMenuOpen(false)}
            >
              <button type="button" className={styles.notificationButton} aria-label="Notificações">
                <Bell size={16} aria-hidden="true" />
                <span className={styles.notificationText}>Notificações</span>
                {notificationsCount > 0 && <span className={styles.badge}>{badgeLabel}</span>}
              </button>
            </div>
          )}

          {(state === 'user' || state === 'company') && (
            <button
              type="button"
              className={styles.profileButton}
              aria-label={`Perfil de ${user.name}`}
            >
              <Avatar name={user.name} imageUrl={user.avatarUrl} theme="dark" />
              <span className={styles.profileText}>
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </span>
            </button>
          )}

          {state === 'noAuth' && (
            <div
              id={menuId}
              className={styles.cluster}
              data-open={menuOpen}
              onClick={() => setMenuOpen(false)}
            >
              <Button
                variant="secondary"
                type="button"
                label="Começar Agora"
                className={styles.navButton}
              />
            </div>
          )}

          <button
            ref={toggleRef}
            type="button"
            className={styles.menuToggle}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      )}
    </nav>
  );
};
