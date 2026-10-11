import * as ToastPrimitive from '@radix-ui/react-toast';
import { CircleAlert, CircleCheckBig, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error';

export interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const DEFAULT_DURATION = 4000;

export const Toast = ({
  open,
  onOpenChange,
  title,
  description,
  variant = 'success',
  duration = DEFAULT_DURATION,
}: ToastProps) => (
  <ToastPrimitive.Provider swipeDirection="right" duration={duration}>
    <ToastPrimitive.Root
      className={styles.toast}
      data-variant={variant}
      open={open}
      onOpenChange={onOpenChange}
    >
      <span className={styles.icon} aria-hidden="true">
        {variant === 'success' ? <CircleCheckBig size={20} /> : <CircleAlert size={20} />}
      </span>

      <div className={styles.content}>
        <ToastPrimitive.Title className={styles.title}>{title}</ToastPrimitive.Title>
        {description === undefined ? null : (
          <ToastPrimitive.Description className={styles.description}>
            {description}
          </ToastPrimitive.Description>
        )}
      </div>

      <ToastPrimitive.Close className={styles.close} aria-label="Fechar notificação">
        <X size={16} aria-hidden="true" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>

    <ToastPrimitive.Viewport className={styles.viewport} />
  </ToastPrimitive.Provider>
);
