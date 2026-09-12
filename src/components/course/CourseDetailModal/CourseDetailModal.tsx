import { X } from 'lucide-react';
import type { FC, MouseEvent, ReactNode } from 'react';
import { useEffect } from 'react';
import styles from './CourseDetailModal.module.css';

export interface CourseDetailModalProps {
  title: string;
  onClose: () => void;
  children?: ReactNode;
}

export const CourseDetailModal: FC<CourseDetailModalProps> = ({ title, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
        aria-labelledby="course-detail-title"
        onMouseDown={stopPropagation}
      >
        <header className={styles.header}>
          <h1 id="course-detail-title">{title}</h1>
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
