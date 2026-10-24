import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, FormField, Modal, PasswordInput } from '@components/ui';
import { ProfileServiceError, profileService } from '@services/profileService';
import styles from './DeactivateAccountModal.module.css';

export interface DeactivateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois que a API desativou a conta. */
  onDeactivated: () => void;
}

const WRONG_PASSWORD_MESSAGE = 'Current password is incorrect';

const describeError = (error: unknown): { field?: string; general?: string } => {
  if (error instanceof ProfileServiceError && error.status === 400) {
    return error.message === WRONG_PASSWORD_MESSAGE
      ? { field: 'Senha atual incorreta.' }
      : { field: 'Informe sua senha atual.' };
  }
  return { general: 'Não foi possível desativar a conta. Tente novamente em instantes.' };
};

/**
 * Confirmação da desativação (FIGMA-16.1). A API exige a senha atual, então o modal
 * pede a senha além do "Tem certeza?" do Figma.
 */
export const DeactivateAccountModal = ({
  open,
  onOpenChange,
  onDeactivated,
}: DeactivateAccountModalProps) => {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) {
      setPassword('');
      setPasswordError(null);
      setGeneralError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!password) {
      setPasswordError('Informe sua senha atual.');
      return;
    }

    setIsSubmitting(true);
    setPasswordError(null);
    setGeneralError(null);
    try {
      await profileService.deactivateAccount(password);
      onDeactivated();
    } catch (error: unknown) {
      const { field, general } = describeError(error);
      setPasswordError(field ?? null);
      setGeneralError(general ?? null);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Tem certeza?"
      icon={<AlertTriangle size={20} />}
      size="sm"
      onSubmit={(event) => void handleSubmit(event)}
      footer={
        <>
          <Button
            type="button"
            variant="ghost-dark"
            label="Cancelar"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          />
          <Button type="submit" variant="danger" label="Sim, desativar" isLoading={isSubmitting} />
        </>
      }
    >
      <div className={styles.body}>
        <p className={styles.description}>
          Esta ação irá desativar sua conta. Você perderá acesso imediato aos cursos e certificados
          emitidos.
        </p>
        <FormField
          label="Confirme sua senha atual"
          htmlFor="deactivate-password"
          required
          error={passwordError ?? undefined}
        >
          <PasswordInput
            id="deactivate-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError(null);
            }}
            autoComplete="current-password"
            invalid={passwordError !== null}
            disabled={isSubmitting}
          />
        </FormField>
        {generalError ? (
          <p className={styles.error} role="alert">
            {generalError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
};
