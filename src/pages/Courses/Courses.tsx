import { Link } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import { Button, CourseCard } from '@components/ui';
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
    <AuthenticatedLayout
      role={role}
      items={courseItems}
      user={currentUser}
      notificationsCount={2}
      onLogout={handleLogout}
    >
      {role === 'admin' ? (
        <div className={styles.adminActions}>
          <Button asChild variant="secondary" label="Novo Curso">
            <Link to="/admin/cursos/novo" />
          </Button>
        </div>
      ) : null}

      <section className={styles.courseSection}>
        <div className={styles.courseGrid}>
          <CourseCard
            id="curso-ia-101"
            imageUrl=""
            category="ai"
            level="basic"
            title="Introdução ao turismo com IA"
            description="Aprenda como reter clientes no setor de turismo com a ajuda da inteligência artificial."
            rating={4.9}
            reviewsCount={247}
            duration="12h"
            lessonsCount={32}
            instructor="Dra. Mariana"
            price="R$ 249,90"
            onClick={() => {}}
          />
        </div>
      </section>
    </AuthenticatedLayout>
  );
};
