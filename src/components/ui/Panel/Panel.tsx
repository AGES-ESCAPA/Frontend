import type { ReactNode } from 'react';
import styles from './Panel.module.css';

export interface PanelProps {
  icon?: ReactNode;
  title?: string;
  /** Conteúdo alinhado à direita do título — ex.: um Badge com a versão atual. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const Panel = ({ icon, title, actions, className = '', children }: PanelProps) => (
  <section className={`${styles.panel} ${className}`.trim()}>
    {title ? (
      <header className={styles.header}>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <h2 className={styles.title}>{title}</h2>
        {actions ? <span className={styles.actions}>{actions}</span> : null}
      </header>
    ) : null}

    {children}
  </section>
);
