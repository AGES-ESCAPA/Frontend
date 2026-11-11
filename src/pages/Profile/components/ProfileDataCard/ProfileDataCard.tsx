import { useState } from 'react';
import type { FormEvent } from 'react';
import { UserRound } from 'lucide-react';
import { AvatarUpload, Button, FormField, MaskedInput, Panel, TextInput } from '@components/ui';
import type { ToastVariant } from '@components/ui';
import { ProfileServiceError, profileService } from '@services/profileService';
import { maskCnpj, maskCpf, maskPhone } from '@utils/masks';
import {
  PROFILE_TEXT_MAX_LENGTH,
  mapProfileApiError,
  toLocalPhoneDigits,
  toProfileFormValues,
  validateProfileForm,
} from '@utils/profileForm';
import type { ProfileFormErrors, ProfileFormField, ProfileFormValues } from '@utils/profileForm';
import type { UserProfile } from '@/types/profile';
import styles from './ProfileDataCard.module.css';

export interface ProfileDataCardProps {
  profile: UserProfile;
  /** Recebe o perfil devolvido pela API depois de salvar. */
  onSaved: (profile: UserProfile) => void;
  onNotify: (variant: ToastVariant, title: string, description?: string) => void;
}

/** CPF só de leitura, com espaço ao redor do traço: 000.000.000 - 00. */
const displayCpf = (value: string) => maskCpf(value).replace(/-(?=\d{2}$)/, ' - ');

const LockedField = ({ id, label, value }: { id: string; label: string; value: string }) => (
  <div className={styles.lockedField}>
    <span className={styles.lockedLabel} id={id}>
      {label}
    </span>
    <p className={styles.lockedValue} aria-labelledby={id}>
      {value}
    </p>
  </div>
);

const formatOrDash = (value: string | null, format: (raw: string) => string = (raw) => raw) =>
  value ? format(value) : '—';

const ReadOnlyItem = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.readOnlyItem}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

export const ProfileDataCard = ({ profile, onSaved, onNotify }: ProfileDataCardProps) => {
  const [values, setValues] = useState<ProfileFormValues>(() => toProfileFormValues(profile));
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isCompany = profile.profile === 'COMPANY';
  const canSave = profile.editable || photo !== null;

  const changeValue = (field: ProfileFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const saveData = async (): Promise<UserProfile | null> => {
    if (!profile.editable) return profile;

    try {
      return await profileService.updateProfile({
        name: values.name.trim(),
        phone: values.phone,
        ...(isCompany ? { companyName: values.companyName.trim() } : {}),
      });
    } catch (error: unknown) {
      const fieldErrors =
        error instanceof ProfileServiceError && error.status === 400
          ? mapProfileApiError(error.message)
          : null;
      if (fieldErrors) {
        setErrors(fieldErrors);
      } else {
        onNotify('error', 'Não foi possível salvar', 'Verifique sua conexão e tente novamente.');
      }
      return null;
    }
  };

  /** Devolve `null` quando o envio da foto falhou (o aviso já foi exibido). */
  const savePhoto = async (saved: UserProfile): Promise<UserProfile | null> => {
    if (!photo) return saved;

    try {
      const avatarUrl = await profileService.uploadAvatar(photo);
      setPhoto(null);
      return { ...saved, avatarUrl };
    } catch {
      onNotify(
        'error',
        'Não foi possível enviar a foto',
        profile.editable
          ? 'Os demais dados foram salvos. Tente enviar a foto novamente.'
          : 'Tente novamente em instantes.',
      );
      return null;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const validationErrors = profile.editable ? validateProfileForm(values, profile.profile) : {};
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const saved = await saveData();
    if (saved) {
      const withPhoto = await savePhoto(saved);
      const updated = withPhoto ?? saved;
      if (updated !== profile) {
        onSaved(updated);
        setValues(toProfileFormValues(updated));
      }
      if (withPhoto) onNotify('success', 'Dados atualizados', 'Suas alterações foram salvas.');
    }
    setIsSaving(false);
  };

  return (
    <AvatarUpload
      imageUrl={profile.avatarUrl}
      name={profile.name}
      onFileSelected={setPhoto}
      size="md"
      compact
      avatarClassName={styles.profileAvatar}
    >
      {({ avatar, changePhotoButton, error }) => (
        <Panel icon={<UserRound size={22} />} title="Dados Cadastrais" className={styles.card}>
          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
            {error}

            {profile.editable ? (
              <div className={styles.fields}>
                <div className={styles.nameBlock}>
                  <FormField
                    label={isCompany ? 'Nome do Responsável' : 'Nome Completo'}
                    htmlFor="profile-name"
                    error={errors.name}
                  >
                    <TextInput
                      id="profile-name"
                      value={values.name}
                      onChange={(event) => changeValue('name', event.target.value)}
                      maxLength={PROFILE_TEXT_MAX_LENGTH}
                      autoComplete="name"
                      invalid={errors.name !== undefined}
                      disabled={isSaving}
                    />
                  </FormField>
                  <div className={styles.photoColumn}>
                    {avatar}
                    {changePhotoButton}
                  </div>
                </div>

                {isCompany ? (
                  <FormField
                    label="Razão Social"
                    htmlFor="profile-company-name"
                    error={errors.companyName}
                  >
                    <TextInput
                      id="profile-company-name"
                      value={values.companyName}
                      onChange={(event) => changeValue('companyName', event.target.value)}
                      maxLength={PROFILE_TEXT_MAX_LENGTH}
                      autoComplete="organization"
                      invalid={errors.companyName !== undefined}
                      disabled={isSaving}
                    />
                  </FormField>
                ) : null}

                <LockedField id="profile-email" label="E-mail" value={profile.email} />
                <LockedField
                  id="profile-document"
                  label={isCompany ? 'CNPJ' : 'CPF'}
                  value={formatOrDash(
                    isCompany ? profile.cnpj : profile.cpf,
                    isCompany ? maskCnpj : displayCpf,
                  )}
                />

                <FormField label="Telefone" htmlFor="profile-phone" error={errors.phone}>
                  <MaskedInput
                    id="profile-phone"
                    mask="phone"
                    value={values.phone}
                    onValueChange={(value) => changeValue('phone', value)}
                    invalid={errors.phone !== undefined}
                    disabled={isSaving}
                  />
                </FormField>
              </div>
            ) : (
              <dl className={styles.readOnlyList}>
                <div className={styles.nameBlock}>
                  <ReadOnlyItem label="Nome Completo" value={profile.name} />
                  <div className={styles.photoColumn}>
                    {avatar}
                    {changePhotoButton}
                  </div>
                </div>
                <ReadOnlyItem label="E-mail" value={profile.email} />
                <ReadOnlyItem label="CPF" value={formatOrDash(profile.cpf, displayCpf)} />
                <ReadOnlyItem
                  label="Telefone Corporativo"
                  value={formatOrDash(toLocalPhoneDigits(profile.phone) || null, maskPhone)}
                />
                <ReadOnlyItem label="Empresa Vinculada" value={formatOrDash(profile.companyName)} />
              </dl>
            )}

            {!profile.editable ? (
              <p className={styles.notice}>
                Seus dados são gerenciados pela empresa. Você pode alterar apenas a foto.
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button
                type="submit"
                variant="primary"
                label={profile.editable ? 'Salvar Alterações' : 'Salvar Foto'}
                isLoading={isSaving}
                disabled={!canSave}
              />
            </div>
          </form>
        </Panel>
      )}
    </AvatarUpload>
  );
};
