import type { ReactNode } from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Ação alinhada à direita do rótulo, como o link de recuperação de senha. */
  labelAction?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const FormField = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  labelAction,
  className = '',
  children,
}: FormFieldProps) => {
  const asterisk = required ? (
    <span className={styles.required} aria-hidden="true">
      *
    </span>
  ) : null;

  const labelNode =
    htmlFor === undefined ? (
      <span className={styles.label}>
        {label}
        {asterisk}
      </span>
    ) : (
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {asterisk}
      </label>
    );

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {labelAction ? (
        <div className={styles.labelRow}>
          {labelNode}
          {labelAction}
        </div>
      ) : (
        labelNode
      )}

      {children}

      {hint === undefined ? null : (
        <p id={htmlFor === undefined ? undefined : `${htmlFor}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}

      {error === undefined ? null : (
        <p
          id={htmlFor === undefined ? undefined : `${htmlFor}-error`}
          className={styles.error}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
