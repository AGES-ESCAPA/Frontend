import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './SelectInput.module.css';

export interface SelectInputOption {
  value: string;
  label: string;
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectInputOption[];
  /** Opção vazia inicial, exibida enquanto nada foi escolhido. */
  placeholder?: string;
  invalid?: boolean;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ options, placeholder, invalid = false, className = '', ...props }, ref) => (
    <div className={`${styles.wrapper} ${className}`.trim()} data-invalid={invalid}>
      <select ref={ref} className={styles.select} aria-invalid={invalid || undefined} {...props}>
        {placeholder === undefined ? null : (
          <option value="" className={styles.option}>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value} className={styles.option}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className={styles.chevron} size={18} aria-hidden="true" />
    </div>
  ),
);

SelectInput.displayName = 'SelectInput';
