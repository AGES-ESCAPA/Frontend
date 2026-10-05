import { Construction } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import { Button } from '@components/ui';
import styles from './UnderConstruction.module.css';

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

const getRoleFromPathname = (pathname: string): SidebarRole | null => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/empresa')) return 'company';
  if (pathname.startsWith('/aluno') || pathname === '/meu-perfil') return 'student';
  return null;
};

const ConstructionMessage = () => (
  <section className={styles.panel}>
    <div className={styles.iconWrap} aria-hidden="true">
      <Construction size={36} />
    </div>
    <p className={styles.eyebrow}>Em breve</p>
    <h1 className={styles.title}>Página em construção</h1>
    <p className={styles.description}>
      Estamos preparando esta área. Enquanto isso, continue explorando os cursos da plataforma.
    </p>
    <span className={styles.stripe} aria-hidden="true" />
  </section>
);

/**
 * Destino das rotas que ainda não têm tela. Nas áreas autenticadas mantém a
 * casca (sidebar e navbar) para a navegação continuar disponível.
 */
export const UnderConstruction = () => {
  const { pathname } = useLocation();
  const role = getRoleFromPathname(pathname);

  if (!role) {
    return (
      <div className={styles.page}>
        <ConstructionMessage />
        <Button asChild variant="primary" label="Voltar ao início">
          <Link to="/" />
        </Button>
      </div>
    );
  }

  const home = SIDEBAR_MENU_PRESETS[role][0];
  const items = SIDEBAR_MENU_PRESETS[role].map((item) => ({
    ...item,
    active: pathname === item.route || pathname.startsWith(`${item.route}/`),
  }));

  return (
    <AuthenticatedLayout role={role} items={items} user={usersByRole[role]}>
      <div className={styles.embedded}>
        <ConstructionMessage />
        <Button asChild variant="primary" label={`Ir para ${home.label}`}>
          <Link to={home.route} />
        </Button>
      </div>
    </AuthenticatedLayout>
  );
};
