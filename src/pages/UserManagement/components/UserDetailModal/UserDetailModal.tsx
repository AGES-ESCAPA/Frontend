import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { SquarePen } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  FormField,
  MaskedInput,
  FieldsSkeleton,
  Modal,
  TextInput,
} from '@components/ui';
import type { BadgeVariant } from '@components/ui';
import { AdminUserServiceError, adminUserService } from '@services/adminUserService';
import type { AdminUser, AdminUserDetail } from '@/types/adminUser';
import type { ProfileType } from '@/types/profile';
import { maskCnpj, maskCpf, maskPhone } from '@utils/masks';
import { mapProfileApiError, toLocalPhoneDigits, validateProfileForm } from '@utils/profileForm';
import type { ProfileFormErrors, ProfileFormValues } from '@utils/profileForm';
import { isValidEmail } from '@utils/validators';
import styles from './UserDetailModal.module.css';

const TITLE_EDIT_ICON_SIZE = 18;

export type UserDetailMode = 'view' | 'edit';

export interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dados da listagem; o modal busca o detalhe completo ao abrir. */
  user: AdminUser | null;
  /** Modo inicial ao abrir (editar vem do ícone na coluna Ações). */
  initialMode?: UserDetailMode;
  /** Chamado após salvar, para atualizar a listagem. */
  onUserChanged?: () => void;
}

type DetailField = {
  label: string;
  value: string;
  kind?: 'text' | 'type' | 'status';
};

const USER_TYPE_LABELS: Record<string, string> = {
  STUDENT: 'Aluno',
  COMPANY: 'Empresa',
  EMPLOYEE: 'Colaborador',
  ADMIN: 'Admin',
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

const EMPTY_FORM: ProfileFormValues = {
  name: '',
  phone: '',
  companyName: '',
  headline: '',
  bio: '',
};

const userTypeKey = (userType: string): string => userType.toUpperCase();

const asProfileType = (userType: string): ProfileType => {
  const key = userTypeKey(userType);
  if (key === 'COMPANY' || key === 'EMPLOYEE' || key === 'ADMIN') return key;
  return 'STUDENT';
};

const userTypeLabel = (userType: string): string =>
  USER_TYPE_LABELS[userTypeKey(userType)] ?? userType;

const userStatusKey = (status: string | null | undefined): string =>
  typeof status === 'string' ? status.trim().toUpperCase() : '';

const userStatusLabel = (status: string | null | undefined): string => {
  const key = userStatusKey(status);
  if (key === '') return '—';
  return USER_STATUS_LABELS[key] ?? status ?? '—';
};

const userStatusVariant = (status: string | null | undefined): BadgeVariant =>
  USER_STATUS_VARIANTS[userStatusKey(status)] ?? 'neutral';

const badgeVariant = (userType: string): BadgeVariant => {
  const key = userTypeKey(userType);
  if (key === 'COMPANY') return 'info';
  if (key === 'ADMIN') return 'secondary';
  if (key === 'EMPLOYEE') return 'warning';
  return 'neutral';
};

const formatShortDate = (value: string): string => {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const displayOrDash = (value: string | null | undefined): string => {
  if (value == null) return '—';
  const trimmed = value.trim();
  return trimmed === '' ? '—' : trimmed;
};

const displayCpf = (value: string | null | undefined): string => {
  if (value == null || value.trim() === '') return '—';
  return maskCpf(value);
};

const displayCnpj = (value: string | null | undefined): string => {
  if (value == null || value.trim() === '') return '—';
  return maskCnpj(value);
};

const displayPhone = (value: string | null | undefined): string => {
  const digits = toLocalPhoneDigits(value ?? null);
  if (digits === '') return '—';
  return maskPhone(digits);
};

const toFormValues = (user: AdminUserDetail): ProfileFormValues => ({
  name: user.name ?? '',
  phone: toLocalPhoneDigits(user.phone ?? null),
  companyName: user.companyName ?? '',
  headline: '',
  bio: '',
});

const metaFields = (user: AdminUserDetail): DetailField[] => [
  { label: 'Tipo', value: user.userType, kind: 'type' },
  { label: 'Status', value: user.status ?? '', kind: 'status' },
  { label: 'Cadastro', value: formatShortDate(user.createdAt) },
];

/** Campos do formulário de cadastro de cada perfil (sem senha). */
const registrationFields = (user: AdminUserDetail): DetailField[] => {
  const type = userTypeKey(user.userType);

  if (type === 'COMPANY') {
    return [
      { label: 'Nome do responsável', value: displayOrDash(user.name) },
      { label: 'CNPJ', value: displayCnpj(user.cnpj) },
      { label: 'Razão social / Nome fantasia', value: displayOrDash(user.companyName) },
      { label: 'E-mail corporativo', value: displayOrDash(user.email) },
      { label: 'Telefone corporativo', value: displayPhone(user.phone) },
      ...metaFields(user),
    ];
  }

  if (type === 'EMPLOYEE') {
    return [
      { label: 'Nome completo', value: displayOrDash(user.name) },
      { label: 'E-mail corporativo', value: displayOrDash(user.email) },
      { label: 'Empresa', value: displayOrDash(user.companyName) },
      ...metaFields(user),
    ];
  }

  if (type === 'ADMIN') {
    return [
      { label: 'Nome', value: displayOrDash(user.name) },
      { label: 'E-mail', value: displayOrDash(user.email) },
      ...metaFields(user),
    ];
  }

  return [
    { label: 'Nome completo', value: displayOrDash(user.name) },
    { label: 'CPF', value: displayCpf(user.cpf) },
    { label: 'E-mail', value: displayOrDash(user.email) },
    { label: 'Telefone / WhatsApp', value: displayPhone(user.phone) },
    ...metaFields(user),
  ];
};

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.lockedField}>
    <span className={styles.lockedLabel}>{label}</span>
    <p className={styles.lockedValue}>{value}</p>
  </div>
);

const renderFieldValue = (field: DetailField, user: AdminUserDetail) => {
  if (field.kind === 'type') {
    return (
      <Badge label={userTypeLabel(user.userType)} variant={badgeVariant(user.userType)} mini />
    );
  }
  if (field.kind === 'status') {
    return (
      <Badge label={userStatusLabel(user.status)} variant={userStatusVariant(user.status)} mini />
    );
  }
  return field.value;
};

export const UserDetailModal = ({
  open,
  onOpenChange,
  user,
  initialMode = 'view',
  onUserChanged,
}: UserDetailModalProps) => {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<UserDetailMode>('view');
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      setDetail(null);
      setLoadStatus('idle');
      setLoadError(null);
      setMode('view');
      setValues(EMPTY_FORM);
      setEmailValue('');
      setEmailError(undefined);
      setErrors({});
      setFormError(null);
      setBlockOpen(false);
      setBlockError(null);
      return;
    }

    const controller = new AbortController();
    setLoadStatus('loading');
    setLoadError(null);
    setDetail(null);
    setMode(initialMode);
    setErrors({});
    setEmailError(undefined);
    setFormError(null);
    setBlockOpen(false);
    setBlockError(null);

    void adminUserService
      .getById(user.id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setDetail(result);
        setValues(toFormValues(result));
        setEmailValue(result.email);
        setMode(initialMode);
        setLoadStatus('success');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDetail(null);
        setLoadStatus('error');
        setLoadError(
          error instanceof AdminUserServiceError
            ? error.message
            : 'Não foi possível carregar o detalhe do usuário.',
        );
      });

    return () => controller.abort();
  }, [open, user, initialMode]);

  if (!open) return null;

  const profile = detail ? asProfileType(detail.userType) : 'STUDENT';
  const isInactive = userStatusKey(detail?.status) === 'INACTIVE';
  const fields = detail ? registrationFields(detail) : [];

  const startEdit = () => {
    if (!detail || isSaving || isBlocking) return;
    setValues(toFormValues(detail));
    setEmailValue(detail.email);
    setEmailError(undefined);
    setErrors({});
    setFormError(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    if (!detail) {
      onOpenChange(false);
      return;
    }
    setValues(toFormValues(detail));
    setEmailValue(detail.email);
    setEmailError(undefined);
    setErrors({});
    setFormError(null);
    setMode('view');
  };

  const changeValue = <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (current[field] === undefined) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || isSaving) return;

    const nextErrors = validateProfileForm(values, profile);
    const trimmedEmail = emailValue.trim().toLowerCase();
    let nextEmailError: string | undefined;
    if (!trimmedEmail) {
      nextEmailError = 'Preenchimento obrigatório.';
    } else if (!isValidEmail(trimmedEmail)) {
      nextEmailError = 'Informe um e-mail válido.';
    }
    setEmailError(nextEmailError);

    if (Object.keys(nextErrors).length > 0 || nextEmailError) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      let updated = await adminUserService.update(detail.id, {
        name: values.name.trim(),
        phone: profile === 'ADMIN' || profile === 'EMPLOYEE' ? undefined : values.phone,
        companyName: profile === 'COMPANY' ? values.companyName.trim() : undefined,
      });

      const emailChanged = trimmedEmail !== detail.email.trim().toLowerCase();
      if (emailChanged) {
        updated = await adminUserService.requestEmailChange(detail.id, trimmedEmail);
      }

      setDetail(updated);
      setValues(toFormValues(updated));
      setEmailValue(updated.email);
      setMode('view');
      onUserChanged?.();
    } catch (error: unknown) {
      if (error instanceof AdminUserServiceError) {
        const message = error.message.toLowerCase();
        if (message.includes('email')) {
          setEmailError(
            message.includes('invalid')
              ? 'Informe um e-mail válido.'
              : message.includes('same')
                ? 'Informe um e-mail diferente do atual.'
                : 'Este e-mail já está em uso.',
          );
        } else {
          const fieldErrors = mapProfileApiError(error.message);
          if (fieldErrors) {
            setErrors(fieldErrors);
          } else {
            setFormError(error.message);
          }
        }
      } else {
        setFormError('Não foi possível salvar os dados do usuário.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!detail || isBlocking) return;
    setIsBlocking(true);
    setBlockError(null);
    try {
      const updated = await adminUserService.deactivate(detail.id);
      setDetail(updated);
      setBlockOpen(false);
      setMode('view');
      onUserChanged?.();
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

  const viewFooter =
    loadStatus === 'success' && detail && mode === 'view' && !isInactive ? (
      <div className={styles.footerActions}>
        <Button
          type="button"
          variant="danger"
          label="Bloquear acesso"
          onClick={() => {
            setBlockError(null);
            setBlockOpen(true);
          }}
          disabled={isSaving || isBlocking}
        />
      </div>
    ) : null;

  const editFooter =
    mode === 'edit' ? (
      <div className={styles.footerActions}>
        <Button
          type="button"
          variant="ghost-dark"
          label="Cancelar"
          onClick={cancelEdit}
          disabled={isSaving}
        />
        <Button type="submit" variant="primary" label="Salvar" isLoading={isSaving} />
      </div>
    ) : null;

  const titleAction =
    mode === 'view' && loadStatus === 'success' && detail ? (
      <button
        type="button"
        className={styles.titleEditButton}
        aria-label="Editar usuário"
        onClick={startEdit}
        disabled={isSaving || isBlocking}
      >
        <SquarePen size={TITLE_EDIT_ICON_SIZE} aria-hidden="true" />
      </button>
    ) : null;

  return (
    <>
      <Modal
        open
        onOpenChange={(nextOpen) => {
          if (isSaving || isBlocking) return;
          onOpenChange(nextOpen);
        }}
        title={mode === 'edit' ? 'Editar usuário' : 'Detalhe do usuário'}
        titleAction={titleAction}
        size="md"
        onSubmit={mode === 'edit' ? handleSave : undefined}
        footer={mode === 'edit' ? editFooter : viewFooter}
      >
        {loadStatus === 'loading' || loadStatus === 'idle' ? (
          <FieldsSkeleton label="Carregando dados do cadastro" />
        ) : null}

        {loadStatus === 'error' ? (
          <p className={styles.error} role="alert">
            {loadError ?? 'Não foi possível carregar o detalhe do usuário.'}
          </p>
        ) : null}

        {loadStatus === 'success' && detail && mode === 'view' ? (
          <>
            {detail.pendingEmail ? (
              <p className={styles.pendingBanner} role="status">
                Aguardando confirmação para alterar o e-mail para{' '}
                <strong>{detail.pendingEmail}</strong>. O endereço atual permanece ativo até a
                confirmação no link enviado.
              </p>
            ) : null}
            <dl className={styles.details}>
              {fields.map((field) => (
                <div key={field.label} className={styles.detailRow}>
                  <dt>{field.label}</dt>
                  <dd>{renderFieldValue(field, detail)}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {loadStatus === 'success' && detail && mode === 'edit' ? (
          <div className={styles.editForm}>
            {profile === 'COMPANY' ? (
              <>
                <FormField
                  label="Nome do responsável"
                  htmlFor="admin-user-name"
                  error={errors.name}
                >
                  <TextInput
                    id="admin-user-name"
                    value={values.name}
                    onChange={(event) => changeValue('name', event.target.value)}
                    invalid={errors.name !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
                <LockedField label="CNPJ" value={displayCnpj(detail.cnpj)} />
                <FormField
                  label="Razão social / Nome fantasia"
                  htmlFor="admin-user-company"
                  error={errors.companyName}
                >
                  <TextInput
                    id="admin-user-company"
                    value={values.companyName}
                    onChange={(event) => changeValue('companyName', event.target.value)}
                    invalid={errors.companyName !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
                <FormField label="E-mail corporativo" htmlFor="admin-user-email" error={emailError}>
                  <TextInput
                    id="admin-user-email"
                    type="email"
                    value={emailValue}
                    onChange={(event) => {
                      setEmailValue(event.target.value);
                      setEmailError(undefined);
                      setFormError(null);
                    }}
                    invalid={emailError !== undefined}
                    disabled={isSaving}
                    autoComplete="email"
                  />
                </FormField>
                <FormField
                  label="Telefone corporativo"
                  htmlFor="admin-user-phone"
                  error={errors.phone}
                >
                  <MaskedInput
                    id="admin-user-phone"
                    mask="phone"
                    value={values.phone}
                    onValueChange={(value) => changeValue('phone', value)}
                    invalid={errors.phone !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
              </>
            ) : null}

            {profile === 'EMPLOYEE' ? (
              <>
                <FormField label="Nome completo" htmlFor="admin-user-name" error={errors.name}>
                  <TextInput
                    id="admin-user-name"
                    value={values.name}
                    onChange={(event) => changeValue('name', event.target.value)}
                    invalid={errors.name !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
                <FormField label="E-mail corporativo" htmlFor="admin-user-email" error={emailError}>
                  <TextInput
                    id="admin-user-email"
                    type="email"
                    value={emailValue}
                    onChange={(event) => {
                      setEmailValue(event.target.value);
                      setEmailError(undefined);
                      setFormError(null);
                    }}
                    invalid={emailError !== undefined}
                    disabled={isSaving}
                    autoComplete="email"
                  />
                </FormField>
                <LockedField label="Empresa" value={displayOrDash(detail.companyName)} />
              </>
            ) : null}

            {profile === 'ADMIN' ? (
              <>
                <FormField label="Nome" htmlFor="admin-user-name" error={errors.name}>
                  <TextInput
                    id="admin-user-name"
                    value={values.name}
                    onChange={(event) => changeValue('name', event.target.value)}
                    invalid={errors.name !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
                <FormField label="E-mail" htmlFor="admin-user-email" error={emailError}>
                  <TextInput
                    id="admin-user-email"
                    type="email"
                    value={emailValue}
                    onChange={(event) => {
                      setEmailValue(event.target.value);
                      setEmailError(undefined);
                      setFormError(null);
                    }}
                    invalid={emailError !== undefined}
                    disabled={isSaving}
                    autoComplete="email"
                  />
                </FormField>
              </>
            ) : null}

            {profile === 'STUDENT' ? (
              <>
                <FormField label="Nome completo" htmlFor="admin-user-name" error={errors.name}>
                  <TextInput
                    id="admin-user-name"
                    value={values.name}
                    onChange={(event) => changeValue('name', event.target.value)}
                    invalid={errors.name !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
                <LockedField label="CPF" value={displayCpf(detail.cpf)} />
                <FormField label="E-mail" htmlFor="admin-user-email" error={emailError}>
                  <TextInput
                    id="admin-user-email"
                    type="email"
                    value={emailValue}
                    onChange={(event) => {
                      setEmailValue(event.target.value);
                      setEmailError(undefined);
                      setFormError(null);
                    }}
                    invalid={emailError !== undefined}
                    disabled={isSaving}
                    autoComplete="email"
                  />
                </FormField>
                <FormField
                  label="Telefone / WhatsApp"
                  htmlFor="admin-user-phone"
                  error={errors.phone}
                >
                  <MaskedInput
                    id="admin-user-phone"
                    mask="phone"
                    value={values.phone}
                    onValueChange={(value) => changeValue('phone', value)}
                    invalid={errors.phone !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
              </>
            ) : null}

            {detail.pendingEmail ? (
              <p className={styles.pendingBanner} role="status">
                Já existe uma troca pendente para <strong>{detail.pendingEmail}</strong>. Salvar um
                novo e-mail cancela a pendência anterior e envia outro link de confirmação.
              </p>
            ) : (
              <p className={styles.emailHint}>
                Alterar o e-mail envia um link de confirmação para o endereço novo. O atual só muda
                após a confirmação.
              </p>
            )}

            <div className={styles.metaRow}>
              {metaFields(detail).map((field) => (
                <div key={field.label} className={styles.detailRow}>
                  <dt>{field.label}</dt>
                  <dd>{renderFieldValue(field, detail)}</dd>
                </div>
              ))}
            </div>

            {formError ? (
              <p className={styles.error} role="alert">
                {formError}
              </p>
            ) : null}
          </div>
        ) : null}

        {loadStatus === 'success' && !detail ? <p role="alert">Usuário não encontrado.</p> : null}
      </Modal>

      <ConfirmDialog
        open={blockOpen}
        title="Bloquear acesso?"
        description={
          detail
            ? `Esta ação torna a conta de “${detail.name}” inativa. A pessoa perde o acesso à plataforma até uma reativação futura.`
            : ''
        }
        confirmLabel="Bloquear acesso"
        cancelLabel="Cancelar"
        isConfirming={isBlocking}
        errorMessage={blockError}
        onConfirm={() => {
          void handleBlockConfirm();
        }}
        onOpenChange={(nextOpen) => {
          if (isBlocking) return;
          setBlockOpen(nextOpen);
          if (!nextOpen) setBlockError(null);
        }}
      />
    </>
  );
};
