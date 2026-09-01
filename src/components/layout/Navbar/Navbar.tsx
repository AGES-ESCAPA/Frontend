import { Bell, BookOpen, Compass, Search, UserCircle2 } from 'lucide-react';
import styles from './Navbar.module.css';

export const Navbar = () => {
  return (
    <nav className={styles.navbar} aria-label="Navegação principal">
      <div className={styles.leftGroup}>
        <button type="button" className={styles.brand} aria-label="Página inicial">
          <span className={styles.brandMark}>escapa!</span>
        </button>

        <div className={styles.navLinks}>
          <a href="/cursos" className={styles.link} aria-label="Cursos">
            <BookOpen size={16} aria-hidden="true" />
            <span>Cursos</span>
          </a>
          <a href="/carros" className={styles.link} aria-label="Carros">
            <Compass size={16} aria-hidden="true" />
            <span>Carros</span>
          </a>
        </div>
      </div>

      <div className={styles.rightGroup}>
        <button type="button" className={styles.iconButton} aria-label="Buscar">
          <Search size={16} aria-hidden="true" />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Notificações">
          <Bell size={16} aria-hidden="true" />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Perfil do usuário">
          <UserCircle2 size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};
