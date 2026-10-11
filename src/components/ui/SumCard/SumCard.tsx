import { useId } from 'react';
import type { ReactNode } from 'react';
import styles from './SumCard.module.css';

export interface SumCardProps {
  /** Rótulo curto exibido acima do valor, em caixa alta. */
  label: string;
  /** Número ou texto de destaque do cartão. */
  value: ReactNode;
  /** Linha de apoio abaixo do valor. */
  description?: string;
  className?: string;
}

export const SumCard = ({ label, value, description, className = '' }: SumCardProps) => {
  const headingId = useId();

  return (
    <article className={`${styles.card} ${className}`.trim()} aria-labelledby={headingId}>
      <p className={styles.label} id={headingId}>
        {label}
      </p>
      <p className={styles.value}>{value}</p>
      {description === undefined ? null : <p className={styles.description}>{description}</p>}
    </article>
  );
};
