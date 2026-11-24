import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import { Button, PageHeader, Toast } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { useProfile } from '@hooks/useProfile';
import { useToast } from '@hooks/useToast';
import { toSidebarRole } from '@routes/access';
import type { UserProfile } from '@/types/profile';
import { ChangePasswordCard } from './components/ChangePasswordCard';
import { DangerZone } from './components/DangerZone';
import { ProfileDataCard } from './components/ProfileDataCard';
import styles from './Profile.module.css';

const PROFILE_ROUTES: Record<SidebarRole, string> = {
  student: '/meu-perfil',
  company: '/empresa/perfil',
  admin: '/admin/perfil',
};

const PAGE_COPY: Record<SidebarRole, { eyebrow?: string; title: string; subtitle: string }> = {
  student: {
    eyebrow: 'Área do Aluno • Meu Perfil',
    title: 'Meu Perfil',
    subtitle: 'Gerencie seus dados cadastrais e segurança',
  },
  company: {
    eyebrow: 'Painel corporativo • Meu Perfil',
    title: 'Perfil da Empresa',
    subtitle: 'Gerencie seus dados cadastrais e segurança',
  },
  admin: {
    eyebrow: 'Painel administrativo • Meu Perfil',
    title: 'Meu Perfil',
    subtitle: 'Gerencie seus dados cadastrais e segurança',
  },
};

/** Usado só até a sessão carregar; depois a casca mostra o usuário logado. */
const FALLBACK_USER: SidebarUser = { name: '', role: '', email: '' };

const resolveProfileRole = (userRole: string | undefined): SidebarRole => {
  if (userRole === 'COMPANY') return 'company';
  if (userRole === 'ADMIN') return 'admin';
  return 'student';
};

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { profile, status, errorMessage, reload, setProfile } = useProfile();
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const role = resolveProfileRole(user?.role);
  const sidebarRole: SidebarRole = user ? toSidebarRole(user.role) : role;
  const copy =
    user?.role === 'EMPLOYEE'
      ? {
          ...PAGE_COPY.student,
          eyebrow: 'Área do Colaborador • Meu Perfil',
        }
      : PAGE_COPY[role];
  const menuItems = SIDEBAR_MENU_PRESETS[sidebarRole].map((item) => ({
    ...item,
    active: item.route === PROFILE_ROUTES[role],
  }));

  const handleSaved = (saved: UserProfile) => {
    setProfile(saved);
    updateUser({ name: saved.name, avatarUrl: saved.avatarUrl });
  };

  const handleDeactivated = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AuthenticatedLayout role={sidebarRole} items={menuItems} user={FALLBACK_USER}>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        className={styles.header}
      />

      {status === 'loading' ? (
        <p className={styles.status} role="status">
          Carregando seus dados...
        </p>
      ) : null}

      {status === 'error' ? (
        <section className={styles.error} role="alert">
          <p>{errorMessage ?? 'Não foi possível carregar seus dados.'}</p>
          <Button type="button" variant="secondary" label="Tentar Novamente" onClick={reload} />
        </section>
      ) : null}

      {status === 'success' && profile ? (
        <div className={styles.content}>
          <div className={styles.cards}>
            <ProfileDataCard profile={profile} onSaved={handleSaved} onNotify={showToast} />
            <ChangePasswordCard onNotify={showToast} />
          </div>
          {profile.editable && profile.profile !== 'ADMIN' ? (
            <DangerZone onDeactivated={handleDeactivated} />
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <Toast
          key={toast.key}
          open={isOpen}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
        />
      ) : null}
    </AuthenticatedLayout>
  );
};
