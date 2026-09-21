import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ invalid = false, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${styles.textarea} ${className}`.trim()}
      data-invalid={invalid}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);

TextArea.displayName = 'TextArea';
