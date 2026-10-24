import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarRole, SidebarUser } from '@components/layout';
import { Button, Toast } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { useProfile } from '@hooks/useProfile';
import { useToast } from '@hooks/useToast';
import { toSidebarRole } from '@routes/access';
import type { UserProfile } from '@/types/profile';
import { DangerZone } from './components/DangerZone';
import { ProfileDataCard } from './components/ProfileDataCard';
import styles from './Profile.module.css';

const PROFILE_ROUTES: Record<Exclude<SidebarRole, 'admin'>, string> = {
  student: '/meu-perfil',
  company: '/empresa/perfil',
};

const PAGE_COPY: Record<Exclude<SidebarRole, 'admin'>, { eyebrow: string; title: string }> = {
  student: { eyebrow: 'Área do Aluno • Configurações', title: 'Meu Perfil' },
  company: { eyebrow: 'Área da Empresa • Configurações', title: 'Perfil da Empresa' },
};

/** Usado só até a sessão carregar; depois a casca mostra o usuário logado. */
const FALLBACK_USER: SidebarUser = { name: '', role: '', email: '' };

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { profile, status, errorMessage, reload, setProfile } = useProfile();
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const role = user?.role === 'COMPANY' ? 'company' : 'student';
  const sidebarRole: SidebarRole = user ? toSidebarRole(user.role) : role;
  const copy = PAGE_COPY[role];
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
      <header className={styles.header}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.subtitle}>Gerencie seus dados cadastrais e segurança</p>
      </header>

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
          </div>
          {profile.editable ? <DangerZone onDeactivated={handleDeactivated} /> : null}
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
