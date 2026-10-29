import { ProgressBar } from '../ProgressBar';
import styles from './BarList.module.css';

export interface BarListItem {
  id: string;
  label: string;
  value: number;
  displayValue?: string;
}

export interface BarListProps {
  items: BarListItem[];
  max?: number;
  ranked?: boolean;
  emptyMessage?: string;
  className?: string;
  'aria-label'?: string;
}

const DEFAULT_EMPTY_MESSAGE = 'Nenhum dado disponível.';

export const BarList = ({
  items,
  max,
  ranked = false,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  className = '',
  'aria-label': ariaLabel,
}: BarListProps) => {
  if (items.length === 0) {
    return <p className={`${styles.empty} ${className}`.trim()}>{emptyMessage}</p>;
  }

  const ceiling = max ?? Math.max(...items.map((item) => item.value));

  return (
    <ol
      className={`${styles.list} ${ranked ? styles.ranked : ''} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {items.map((item, index) => (
        <li key={item.id} className={styles.item}>
          {ranked ? (
            <span className={styles.rank} aria-hidden="true">
              {index + 1}
            </span>
          ) : null}
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.value}>{item.displayValue ?? item.value}</span>
            </div>
            <ProgressBar value={item.value} max={ceiling} aria-label={item.label} />
          </div>
        </li>
      ))}
    </ol>
  );
};
