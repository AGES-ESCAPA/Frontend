import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../Button';
import styles from './ConfirmDialog.module.css';

export type ConfirmDialogVariant = 'danger' | 'success';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  errorMessage?: string | null;
  /** Aparência do ícone e do botão de confirmação. Padrão: `danger`. */
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
  errorMessage,
  variant = 'danger',
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) => {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isConfirming) return;
    onOpenChange(nextOpen);
  };

  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <span
            className={`${styles.icon} ${isSuccess ? styles.iconSuccess : styles.iconDanger}`}
            aria-hidden="true"
          >
            <Icon size={20} />
          </span>

          <Dialog.Title className={styles.title}>{title}</Dialog.Title>

          <Dialog.Description className={styles.description}>{description}</Dialog.Description>

          {errorMessage ? (
            <p role="alert" className={styles.errorMessage}>
              {errorMessage}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost-dark"
              label={cancelLabel}
              fullWidth
              className={styles.cancelButton}
              disabled={isConfirming}
              onClick={() => handleOpenChange(false)}
            />

            <Button
              type="button"
              variant={isSuccess ? 'primary' : 'danger'}
              label={confirmLabel}
              fullWidth
              className={`${styles.confirmButton} ${isSuccess ? styles.confirmSuccess : styles.confirmDanger}`}
              isLoading={isConfirming}
              onClick={onConfirm}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
