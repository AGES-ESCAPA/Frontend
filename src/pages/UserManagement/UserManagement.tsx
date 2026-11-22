import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Briefcase,
  Building2,
  Eye,
  Shield,
  SquarePen,
  UserRound,
} from 'lucide-react';

import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import {
  Badge,
  Button,
  ConfirmDialog,
  SearchBar,
  SumCard,
  Table,
  TableFilter,
} from '@components/ui';
import type {
  BadgeVariant,
  SelectInputOption,
  TableColumn,
  TableFilterSelectField,
} from '@components/ui';
import { useOptionalAuth } from '@contexts/useAuth';
import { useAdminUsers } from '@hooks/useAdminUsers';
import { AdminUserServiceError, adminUserService } from '@services/adminUserService';
import type { AdminUser } from '@/types/adminUser';
import { UserDetailModal } from './components/UserDetailModal/UserDetailModal';
import type { UserDetailMode } from './components/UserDetailModal/UserDetailModal';
import styles from './UserManagement.module.css';

/** Usado só até a sessão carregar; a casca troca pelo usuário autenticado. */
const FALLBACK_USER: SidebarUser = { name: '', role: '', email: '' };

const PAGE_SIZE = 10;
const ROW_ICON_SIZE = 14;

const USER_TYPE_OPTIONS: readonly SelectInputOption[] = [
  { value: '', label: 'Todos' },
  { value: 'STUDENT', label: 'Aluno' },
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'EMPLOYEE', label: 'Colaborador' },
  { value: 'ADMIN', label: 'Admin' },
];

const USER_STATUS_OPTIONS: readonly SelectInputOption[] = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'PENDING', label: 'Pendente' },
];

const USER_TYPE_LABELS: Record<string, string> = {
  STUDENT: 'Aluno',
  COMPANY: 'Empresa',
  EMPLOYEE: 'Colaborador',
  ADMIN: 'Admin',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  STUDENT: styles.studentBadge,
  COMPANY: styles.companyBadge,
  EMPLOYEE: styles.employeeBadge,
  ADMIN: styles.adminBadge,
};

const menuItems = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
  ...item,
  active: item.route === '/admin/usuarios',
}));

const formatShortDate = (value: string): string => {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const userTypeKey = (userType: string): string => userType.toUpperCase();

const userTypeLabel = (userType: string): string =>
  USER_TYPE_LABELS[userTypeKey(userType)] ?? userType;

const TypeIcon = ({ userType }: { userType: string }) => {
  const key = userTypeKey(userType);
  if (key === 'COMPANY') return <Building2 size={ROW_ICON_SIZE} aria-hidden="true" />;
  if (key === 'ADMIN') return <Shield size={ROW_ICON_SIZE} aria-hidden="true" />;
  if (key === 'EMPLOYEE') return <Briefcase size={ROW_ICON_SIZE} aria-hidden="true" />;
  return <UserRound size={ROW_ICON_SIZE} aria-hidden="true" />;
};

const matchesSearch = (user: AdminUser, term: string): boolean => {
  if (term === '') return true;
  return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
};

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
};

const USER_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'error',
  PENDING: 'warning',
};

const userStatusKey = (status: string | null | undefined): string =>
  typeof status === 'string' ? status.trim().toUpperCase() : '';

const userStatusLabel = (status: string | null | undefined): string => {
  const key = userStatusKey(status);
  if (key === '') return '—';
  return USER_STATUS_LABELS[key] ?? status ?? '—';
};

const userStatusVariant = (status: string | null | undefined): BadgeVariant =>
  USER_STATUS_VARIANTS[userStatusKey(status)] ?? 'neutral';

export const UserManagement = () => {
  const sessionUser = useOptionalAuth()?.user;
  const sidebarUser: SidebarUser = sessionUser
    ? {
        name: sessionUser.name,
        role: 'Administrador',
        email: sessionUser.email,
        avatarUrl: sessionUser.avatarUrl ?? undefined,
      }
    : FALLBACK_USER;
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<UserDetailMode>('view');
  const [userToBlock, setUserToBlock] = useState<AdminUser | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const { users, status, errorMessage, reload } = useAdminUsers();
  const currentUserId = sessionUser?.id;

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const typeMatches = userType === '' || userTypeKey(user.userType) === userType;
      const statusMatches = userStatus === '' || userStatusKey(user.status) === userStatus;
      return typeMatches && statusMatches && matchesSearch(user, term);
    });
  }, [users, searchTerm, userType, userStatus]);

  const totalElements = filteredUsers.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const pageUsers = filteredUsers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const statsReady = status === 'success';
  /** Resumo global (sem filtros); a tabela usa {@link filteredUsers}. */
  const countByType = (type: string) =>
    users.filter((user) => userTypeKey(user.userType) === type).length;
  const totalRegistered = users.length;

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const handleSearch = (term: string) => {
    const trimmed = term.trim();
    if (trimmed === searchTerm) return;
    setSearchTerm(trimmed);
    setPage(0);
  };

  const handleTypeChange = (nextType: string) => {
    setUserType(nextType);
    setPage(0);
  };

  const handleStatusChange = (nextStatus: string) => {
    setUserStatus(nextStatus);
    setPage(0);
  };

  const filterSelects: TableFilterSelectField[] = [
    {
      id: 'type',
      label: 'Tipo',
      value: userType,
      options: USER_TYPE_OPTIONS,
      onChange: handleTypeChange,
    },
    {
      id: 'status',
      label: 'Status',
      value: userStatus,
      options: USER_STATUS_OPTIONS,
      onChange: handleStatusChange,
    },
  ];

  const openUserModal = (userId: string, mode: UserDetailMode) => {
    setModalMode(mode);
    setSelectedUserId(userId);
  };

  const handleBlockDialogChange = (open: boolean) => {
    if (isBlocking) return;
    if (!open) {
      setUserToBlock(null);
      setBlockError(null);
    }
  };

  const handleConfirmBlock = async () => {
    if (!userToBlock || isBlocking) return;
    setIsBlocking(true);
    setBlockError(null);
    try {
      await adminUserService.deactivate(userToBlock.id);
      setUserToBlock(null);
      reload();
    } catch (error: unknown) {
      setBlockError(
        error instanceof AdminUserServiceError
          ? error.message
          : 'Não foi possível bloquear o usuário.',
      );
    } finally {
      setIsBlocking(false);
    }
  };

  const columns: TableColumn<AdminUser>[] = [
    {
      id: 'name',
      header: 'Nome',
      align: 'start',
      render: (user) => <span className={styles.name}>{user.name}</span>,
    },
    {
      id: 'email',
      header: 'E-mail',
      align: 'start',
      render: (user) => <span className={styles.email}>{user.email}</span>,
    },
    {
      id: 'type',
      header: 'Tipo',
      render: (user) => (
        <span
          className={`${styles.typeBadge} ${TYPE_BADGE_CLASS[userTypeKey(user.userType)] ?? styles.studentBadge}`}
        >
          <TypeIcon userType={user.userType} />
          {userTypeLabel(user.userType)}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Cadastro',
      render: (user) => formatShortDate(user.createdAt),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      render: (user) => (
        <Badge
          label={userStatusLabel(user.status)}
          variant={userStatusVariant(user.status)}
          mini
          className={styles.statusBadge}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      render: (user) => {
        const isInactive = userStatusKey(user.status) === 'INACTIVE';
        const isSelf = currentUserId !== undefined && user.id === currentUserId;
        return (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Ver usuário ${user.name}`}
              title="Ver usuário"
              onClick={() => openUserModal(user.id, 'view')}
            >
              <Eye size={ROW_ICON_SIZE} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Editar usuário ${user.name}`}
              title="Editar usuário"
              onClick={() => openUserModal(user.id, 'edit')}
            >
              <SquarePen size={ROW_ICON_SIZE} aria-hidden="true" />
            </button>
            {!isInactive && !isSelf ? (
              <button
                type="button"
                className={`${styles.iconButton} ${styles.blockButton}`}
                aria-label={`Bloquear usuário ${user.name}`}
                title="Bloquear usuário"
                onClick={() => {
                  setBlockError(null);
                  setUserToBlock(user);
                }}
              >
                <Ban size={ROW_ICON_SIZE} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <AuthenticatedLayout role="admin" items={menuItems} user={sidebarUser}>
      <section className={styles.catalog}>
        <div className={styles.toolbar}>
          <div>
            <p className={styles.eyebrow}>Administração</p>
            <h1 className={styles.heading}>Gestão de Usuários</h1>
            <p className={styles.description}>Consulte as contas cadastradas na plataforma.</p>
          </div>
        </div>
      </section>

      <section className={styles.stats} aria-label="Resumo dos usuários">
        <SumCard
          label="Usuários cadastrados"
          value={statsReady ? totalRegistered : '—'}
          description="incluindo todos os perfis"
        />
        <SumCard
          label="Alunos"
          value={statsReady ? countByType('STUDENT') : '—'}
          description="pessoas físicas avulsas"
        />
        <SumCard
          label="Colaboradores"
          value={statsReady ? countByType('EMPLOYEE') : '—'}
          description="vinculados a empresas"
        />
        <SumCard
          label="Empresas"
          value={statsReady ? countByType('COMPANY') : '—'}
          description="contas corporativas"
        />
        <SumCard
          label="Admins"
          value={statsReady ? countByType('ADMIN') : '—'}
          description="equipe da plataforma"
        />
      </section>

      <section className={styles.usersPanel} aria-label="Listagem de usuários">
        <header className={styles.panelHeader}>
          <div className={styles.panelControls}>
            <TableFilter
              selects={filterSelects}
              showClearButton={false}
              className={styles.inlineFilters}
            />
            <div className={styles.search}>
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar usuário"
                aria-label="Buscar usuário"
              />
            </div>
          </div>
        </header>

        {status === 'error' ? (
          <div className={styles.errorState} role="alert">
            <h3 className={styles.errorTitle}>Não foi possível carregar os usuários</h3>
            <p className={styles.errorDescription}>
              {errorMessage ?? 'Verifique sua conexão e tente novamente em instantes.'}
            </p>
            <Button variant="primary" label="Tentar novamente" onClick={reload} />
          </div>
        ) : status === 'loading' ? (
          <p className={styles.loading} role="status">
            Carregando usuários…
          </p>
        ) : (
          <Table
            columns={columns}
            data={pageUsers}
            getRowId={(user) => user.id}
            caption="Usuários da plataforma"
            emptyMessage="Nenhum usuário encontrado para os filtros selecionados."
            className={styles.usersTable}
            footer={
              <div className={styles.tableFooter}>
                <p className={styles.footerText}>
                  Mostrando {pageUsers.length} de {totalElements} usuários
                </p>
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageArrow}
                    aria-label="Anterior"
                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                    disabled={page === 0}
                  >
                    <ArrowLeft size={ROW_ICON_SIZE} aria-hidden="true" />
                  </button>
                  <span className={styles.pageIndicator}>
                    Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.pageArrow}
                    aria-label="Próxima"
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
                    disabled={page + 1 >= totalPages}
                  >
                    <ArrowRight size={ROW_ICON_SIZE} aria-hidden="true" />
                  </button>
                </div>
                <p className={`${styles.footerText} ${styles.panelNote}`}>
                  Listagem de contas da plataforma
                </p>
              </div>
            }
          />
        )}
      </section>

      <UserDetailModal
        open={selectedUserId !== null}
        initialMode={modalMode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null);
            setModalMode('view');
          }
        }}
        user={selectedUser}
        onUserChanged={reload}
      />

      <ConfirmDialog
        open={userToBlock !== null}
        title="Bloquear acesso?"
        description={
          userToBlock
            ? `Esta ação torna a conta de “${userToBlock.name}” inativa. A pessoa perde o acesso à plataforma até uma reativação futura.`
            : ''
        }
        confirmLabel="Bloquear acesso"
        cancelLabel="Cancelar"
        isConfirming={isBlocking}
        errorMessage={blockError}
        onConfirm={() => {
          void handleConfirmBlock();
        }}
        onOpenChange={handleBlockDialogChange}
      />
    </AuthenticatedLayout>
  );
};
