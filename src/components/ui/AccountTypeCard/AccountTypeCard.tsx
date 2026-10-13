import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './AccountTypeCard.module.css';

export interface AccountTypeCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
}

export const AccountTypeCard = ({ title, description, icon, to }: AccountTypeCardProps) => {
  return (
    <Link to={to} className={styles.card} aria-label={title}>
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon}
      </div>

      <h2 className={styles.title}>{title}</h2>

      <p className={styles.description}>{description}</p>
    </Link>
  );
};
