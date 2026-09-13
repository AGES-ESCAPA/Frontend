import { X } from 'lucide-react';
import type { FC, MouseEvent, ReactNode } from 'react';
import { useEffect } from 'react';
import styles from './CourseDetailModal.module.css';

export interface CourseDetailModalProps {
  onClose: () => void;
  children?: ReactNode;
}

export const CourseDetailModal: FC<CourseDetailModalProps> = ({ onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const preventBackgroundScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!document.querySelector('[role="dialog"]')?.contains(target)) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('wheel', preventBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', preventBackgroundScroll, { passive: false });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('wheel', preventBackgroundScroll);
      document.removeEventListener('touchmove', preventBackgroundScroll);
    };
  }, [onClose]);

  const stopPropagation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={onClose}
      data-testid="course-detail-backdrop"
    >
      <aside
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do curso"
        onMouseDown={stopPropagation}
      >
        <header className={styles.header}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </aside>
    </div>
  );
};
