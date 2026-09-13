import * as Progress from '@radix-ui/react-progress';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** Valor atual da barra. É limitado entre 0 e `max`. */
  value: number;
  /** Teto da barra. O preenchimento é `value / max`. */
  max?: number;
  className?: string;
  'aria-label'?: string;
}

const DEFAULT_MAX = 100;

const toPercent = (value: number, max: number): number => {
  if (max <= 0) return 0;

  const clamped = Math.min(Math.max(value, 0), max);
  return (clamped / max) * 100;
};

export const ProgressBar = ({
  value,
  max = DEFAULT_MAX,
  className = '',
  'aria-label': ariaLabel,
}: ProgressBarProps) => {
  const percent = toPercent(value, max);

  return (
    <Progress.Root
      className={`${styles.root} ${className}`.trim()}
      value={percent}
      max={DEFAULT_MAX}
      aria-label={ariaLabel}
    >
      <Progress.Indicator className={styles.indicator} style={{ width: `${percent}%` }} />
    </Progress.Root>
  );
};
