import type { ReactNode } from 'react';
import styles from './LessonModal.module.css';

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export const FormField = ({
  id,
  label,
  required = false,
  optional = false,
  hint,
  error,
  children,
}: FormFieldProps) => (
  <div className={styles.field}>
    <label className={styles.label} htmlFor={id}>
      {label}
      {required ? (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      ) : null}
      {optional ? <span className={styles.optional}>(opcional)</span> : null}
    </label>

    {children}

    {hint && !error ? <p className={styles.hint}>{hint}</p> : null}
    {error ? (
      <p className={styles.error} id={`${id}-error`} role="alert">
        {error}
      </p>
    ) : null}
  </div>
);
