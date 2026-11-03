import { ProgressBar } from '@components/ui/ProgressBar';
import styles from './BarList.module.css';

export interface BarListItem {
  id: string;
  label: string;
  value: number;
  displayValue?: string;
}

export interface BarListProps {
  items: BarListItem[];
  /** Teto das barras. Padrão: maior valor da lista. Para porcentagens, passe `100`. */
  max?: number;
  ranked?: boolean;
  emptyMessage?: string;
  className?: string;
  'aria-label'?: string;
}

const DEFAULT_EMPTY_MESSAGE = 'Nenhum dado disponível.';

const formatValue = (value: number): string =>
  Number.isFinite(value) ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—';

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

  const finiteValues = items.map((item) => item.value).filter(Number.isFinite);
  const ceiling = max ?? Math.max(0, ...finiteValues);
  const List = ranked ? 'ol' : 'ul';

  return (
    <List role="list" className={`${styles.list} ${className}`.trim()} aria-label={ariaLabel}>
      {items.map((item, index) => {
        const text = item.displayValue ?? formatValue(item.value);

        return (
          <li key={item.id} className={styles.item}>
            {ranked ? (
              <span className={styles.rank} aria-hidden="true">
                {index + 1}
              </span>
            ) : null}
            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.label} title={item.label}>
                  {item.label}
                </span>
                <span className={styles.value}>{text}</span>
              </div>
              <ProgressBar
                variant="chart"
                value={Number.isFinite(item.value) ? item.value : 0}
                max={ceiling}
                aria-label={item.label}
                valueLabel={text}
              />
            </div>
          </li>
        );
      })}
    </List>
  );
};
