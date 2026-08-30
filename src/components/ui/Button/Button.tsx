import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'active';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Text displayed on the button (required). */
  label: string;
  /** Icon displayed to the left of the label. If omitted, the button shows only text. */
  icon?: ReactNode;
  /** Visual appearance of the button (required). */
  variant: ButtonVariant;
  /** If true, the button occupies 100% of the parent container width. */
  fullWidth?: boolean;
  /** If true, replaces label and icon with a centered spinner and blocks interaction. */
  isLoading?: boolean;
  /**
   * Merges the button's props onto its immediate child element via Radix Slot.
   * Useful for rendering the button as a link (`<a>`) or router `<Link>`.
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      label,
      icon,
      variant,
      fullWidth = false,
      isLoading = false,
      asChild = false,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    const classNames = [
      styles.button,
      styles[`variant-${variant}`],
      fullWidth && styles.fullWidth,
      isDisabled && !isLoading && styles.disabled,
      isLoading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        <Component
          ref={ref}
          className={classNames}
          disabled={isDisabled}
          aria-busy={isLoading}
          aria-label={label}
          {...props}
        >
          {isLoading ? <Loader2 className={styles.spinner} size={20} aria-hidden="true" /> : null}
          {!isLoading && icon ? <span className={styles.icon}>{icon}</span> : null}
          {!isLoading && <span className={styles.label}>{label}</span>}
          {!isLoading && asChild && <Slottable>{children}</Slottable>}
        </Component>
      </div>
    );
  },
);

Button.displayName = 'Button';
