import { Navbar, Sidebar, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import styles from './Courses.module.css';

const usersByRole: Record<SidebarRole, SidebarUser> = {
  student: {
    name: 'Jorge Amado',
    role: 'Aluno',
    email: 'aluno@email.com',
  },
  admin: {
    name: 'Admin',
    role: 'Administrador',
    email: 'admin@email.com',
  },
  company: {
    name: 'Escapa!',
    role: 'Empresa',
    email: 'escapa@email.com',
  },
};

const getRole = (): SidebarRole => {
  const role = new URLSearchParams(window.location.search).get('role');
  return role === 'admin' || role === 'company' || role === 'student' ? role : 'student';
};

export const Courses = () => {
  const role = getRole();
  const currentUser = usersByRole[role];
  const courseItems = SIDEBAR_MENU_PRESETS[role].map((item, index) => ({
    ...item,
    route: index === 0 ? `/courses?role=${role}` : item.route,
    active: index === 0,
  }));

  const handleLogout = () => {
    window.location.assign('/');
  };

  return (
    <div className={styles.page}>
      <Sidebar role={role} items={courseItems} user={currentUser} onLogout={handleLogout} />

      <div className={styles.contentShell}>
        <Navbar
          state={role === 'company' ? 'company' : 'user'}
          user={{ name: currentUser.name, role: currentUser.role }}
          notificationsCount={2}
        />
      </div>
    </div>
  );
};
