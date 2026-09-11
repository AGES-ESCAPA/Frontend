import type { FormEvent, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  /** Controla a visibilidade do modal (componente controlado). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título exibido no cabeçalho e usado como nome acessível do diálogo. */
  title: string;
  /** Linha de apoio abaixo do título (ex.: módulo de destino). */
  subtitle?: string;
  /** Ícone exibido à esquerda do título. */
  icon?: ReactNode;
  /** Conteúdo da barra inferior, normalmente os botões de ação. */
  footer?: ReactNode;
  size?: ModalSize;
  /**
   * Quando informado, corpo e rodapé são envolvidos por um `<form>`, permitindo
   * que um botão `type="submit"` no rodapé envie os campos do corpo.
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  closeButtonLabel?: string;
  children: ReactNode;
}

export const Modal = ({
  open,
  onOpenChange,
  title,
  subtitle,
  icon,
  footer,
  size = 'md',
  onSubmit,
  closeButtonLabel = 'Fechar',
  children,
}: ModalProps) => {
  // Sem subtítulo não existe `Dialog.Description`: declarar `aria-describedby`
  // como indefinido informa ao Radix que a ausência é intencional.
  const describedBy = subtitle ? {} : { 'aria-describedby': undefined };

  const content = (
    <>
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={`${styles.content} ${styles[`size-${size}`]}`} {...describedBy}>
          <header className={styles.header}>
            {icon ? (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            ) : null}

            <div className={styles.headings}>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              {subtitle ? (
                <Dialog.Description className={styles.subtitle}>{subtitle}</Dialog.Description>
              ) : null}
            </div>

            <Dialog.Close className={styles.close} aria-label={closeButtonLabel}>
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </Dialog.Close>
          </header>

          {onSubmit ? (
            <form className={styles.shell} onSubmit={onSubmit} noValidate>
              {content}
            </form>
          ) : (
            <div className={styles.shell}>{content}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
