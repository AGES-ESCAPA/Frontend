import type { ReactNode } from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const FormField = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) => {
  const asterisk = required ? (
    <span className={styles.required} aria-hidden="true">
      *
    </span>
  ) : null;

  return (
    <div className={styles.field}>
      {htmlFor === undefined ? (
        <span className={styles.label}>
          {label}
          {asterisk}
        </span>
      ) : (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {asterisk}
        </label>
      )}

      {children}

      {error === undefined ? (
        hint === undefined ? null : (
          <p className={styles.hint}>{hint}</p>
        )
      ) : (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
