import type { ReactNode } from 'react';
import styles from './Panel.module.css';

export interface PanelProps {
  icon?: ReactNode;
  title?: string;
  className?: string;
  children: ReactNode;
}

export const Panel = ({ icon, title, className = '', children }: PanelProps) => (
  <section className={`${styles.panel} ${className}`.trim()}>
    {title ? (
      <header className={styles.header}>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <h2 className={styles.title}>{title}</h2>
      </header>
    ) : null}

    {children}
  </section>
);
