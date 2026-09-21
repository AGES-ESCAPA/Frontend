import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícone discreto exibido dentro do campo, antes do valor. */
  icon?: ReactNode;
  /** Selo destacado colado à esquerda do campo (ex.: "R$" no preço base). */
  addon?: ReactNode;
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ icon, addon, invalid = false, className = '', ...props }, ref) => {
    const wrapperClassNames = [
      styles.wrapper,
      icon && styles.hasIcon,
      addon && styles.hasAddon,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames} data-invalid={invalid}>
        {addon ? (
          <span className={styles.addon} aria-hidden="true">
            {addon}
          </span>
        ) : null}

        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          type="text"
          className={styles.input}
          aria-invalid={invalid || undefined}
          {...props}
        />
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';
