import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { Button, FormField, Panel, PasswordInput } from '@components/ui';
import type { ToastVariant } from '@components/ui';
import { ProfileServiceError, profileService } from '@services/profileService';
import styles from './ChangePasswordCard.module.css';

export interface ChangePasswordCardProps {
  onNotify: (variant: ToastVariant, title: string, description?: string) => void;
}

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';
type PasswordValues = Record<PasswordField, string>;
type PasswordErrors = Partial<Record<PasswordField, string>>;

const MIN_PASSWORD_LENGTH = 8;
const EMPTY_VALUES: PasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

const validate = ({ currentPassword, newPassword, confirmPassword }: PasswordValues) => {
  const errors: PasswordErrors = {};
  if (!currentPassword) errors.currentPassword = 'Informe sua senha atual.';
  if (!newPassword.trim()) errors.newPassword = 'Informe a nova senha.';
  else if (newPassword.length < MIN_PASSWORD_LENGTH)
    errors.newPassword = 'A senha deve ter pelo menos 8 caracteres.';
  if (!confirmPassword) errors.confirmPassword = 'Confirme a nova senha.';
  else if (confirmPassword !== newPassword) errors.confirmPassword = 'As senhas devem ser iguais.';
  return errors;
};

/** Traduz o 400 da API para o campo correspondente; os demais 400 são de senha fraca. */
const mapApiError = (message: string): PasswordErrors => {
  switch (message) {
    case 'Current password is incorrect':
      return { currentPassword: 'Senha atual incorreta.' };
    case 'Current password is required':
      return { currentPassword: 'Informe sua senha atual.' };
    case 'Password must be at least 8 characters':
      return { newPassword: 'A senha deve ter pelo menos 8 caracteres.' };
    default:
      return { newPassword: 'A nova senha não atende aos requisitos de segurança.' };
  }
};

export const ChangePasswordCard = ({ onNotify }: ChangePasswordCardProps) => {
  const [values, setValues] = useState<PasswordValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const changeValue = (field: PasswordField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      await profileService.changePassword(values.currentPassword, values.newPassword);
      setValues(EMPTY_VALUES);
      setErrors({});
      onNotify('success', 'Senha alterada', 'Sua nova senha já está valendo.');
    } catch (error: unknown) {
      if (error instanceof ProfileServiceError && error.status === 400) {
        setErrors(mapApiError(error.message));
      } else {
        onNotify(
          'error',
          'Não foi possível alterar a senha',
          'Verifique sua conexão e tente novamente.',
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: PasswordField, label: string, autoComplete: string) => {
    const id = `change-password-${field}`;
    return (
      <FormField label={label} htmlFor={id} required error={errors[field]}>
        <PasswordInput
          id={id}
          value={values[field]}
          onChange={(event) => changeValue(field, event.target.value)}
          autoComplete={autoComplete}
          invalid={errors[field] !== undefined}
          disabled={isSaving}
        />
      </FormField>
    );
  };

  return (
    <Panel icon={<KeyRound size={22} />} title="Alterar Senha" className={styles.card}>
      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className={styles.fields}>
          {renderField('currentPassword', 'Senha atual', 'current-password')}
          {renderField('newPassword', 'Nova senha', 'new-password')}
          {renderField('confirmPassword', 'Confirmar nova senha', 'new-password')}
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" label="Alterar Senha" isLoading={isSaving} />
        </div>
      </form>
    </Panel>
  );
};
