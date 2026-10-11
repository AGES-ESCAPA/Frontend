import styles from './Switch.module.css';

export interface SwitchProps {
  /** Estado atual do interruptor (componente controlado). */
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  /** Use quando não houver um rótulo visível associado via `aria-labelledby`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export const Switch = ({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      data-state={checked ? 'checked' : 'unchecked'}
      className={`${styles.track} ${checked ? styles.checked : ''}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className={styles.thumb} aria-hidden="true" />
    </button>
  );
};
