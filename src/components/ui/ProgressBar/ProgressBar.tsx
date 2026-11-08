import * as Progress from '@radix-ui/react-progress';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** Valor atual da barra. É limitado entre 0 e `max`. */
  value: number;
  /** Teto da barra. O preenchimento é `value / max`. */
  max?: number;
  className?: string;
  variant?: 'default' | 'success' | 'chart';
  /** Texto lido pelo leitor de tela no lugar da porcentagem (ex.: "92%", "259"). */
  valueLabel?: string;
  'aria-label'?: string;
}

const DEFAULT_MAX = 100;

const VARIANT_CLASS = {
  default: '',
  success: styles.success,
  chart: styles.chart,
} as const;

const toPercent = (value: number, max: number): number => {
  if (max <= 0) return 0;

  const clamped = Math.min(Math.max(value, 0), max);
  return (clamped / max) * 100;
};

export const ProgressBar = ({
  value,
  max = DEFAULT_MAX,
  className = '',
  variant = 'default',
  valueLabel,
  'aria-label': ariaLabel,
}: ProgressBarProps) => {
  const percent = toPercent(value, max);

  return (
    <Progress.Root
      className={`${styles.root} ${VARIANT_CLASS[variant]} ${className}`.trim()}
      value={percent}
      max={DEFAULT_MAX}
      getValueLabel={valueLabel ? () => valueLabel : undefined}
      aria-label={ariaLabel}
    >
      <Progress.Indicator className={styles.indicator} style={{ width: `${percent}%` }} />
    </Progress.Root>
  );
};
