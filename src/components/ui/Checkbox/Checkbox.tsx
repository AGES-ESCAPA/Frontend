import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Texto principal, ao lado da caixa. */
  label: ReactNode;
  /** Linha de apoio, exibida abaixo do label em tom mais discreto. */
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <label className={`${styles.row} ${className}`.trim()} htmlFor={inputId}>
        <span className={styles.box}>
          <input ref={ref} id={inputId} type="checkbox" className={styles.input} {...props} />
          <span className={styles.mark} aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
        </span>

        <span className={styles.text}>
          <span className={styles.label}>{label}</span>
          {hint === undefined ? null : <span className={styles.hint}>{hint}</span>}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
