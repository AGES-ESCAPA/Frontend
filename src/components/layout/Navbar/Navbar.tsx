import { Bell } from 'lucide-react';
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
  const hasProfile = state === 'user' || state === 'company';
  const isValidProfile = hasProfile && user;
  const badgeLabel = notificationsCount > 99 ? '99+' : notificationsCount;

  return (
    <nav className={styles.navbar} aria-label="Navegação principal" data-state={state}>
      <div className={styles.leftGroup}>
        <a href="/" className={styles.brand} aria-label="Página inicial">
          <img src={logo} alt="escapa!" />
        </a>
        {state !== 'user' && state !== 'company' && <span className={styles.context}>cursos</span>}
      </div>

      {state === 'noAuth' && (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            className={styles.loginButton}
            href="/login"
            aria-label="Acessar a plataforma"
          >
            Entrar
          </Button>
          <Button variant="secondary" type="button">
            Começar Agora
          </Button>
        </div>
      )}

      {isValidProfile && (
        <div className={styles.profileActions}>
          <button type="button" className={styles.notificationButton} aria-label="Notificações">
            <Bell size={16} aria-hidden="true" />
            {notificationsCount > 0 && <span className={styles.badge}>{badgeLabel}</span>}
          </button>
          <button
            type="button"
            className={styles.profileButton}
            aria-label={`Perfil de ${user.name}`}
          >
            <Avatar name={user.name} avatarUrl={user.avatarUrl} theme="dark" />
            <span className={styles.profileText}>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
          </button>
        </div>
      )}
    </nav>
  );
};
