import { forwardRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { TextInput } from '../TextInput';
import type { TextInputProps } from '../TextInput';
import styles from './PasswordInput.module.css';

export interface PasswordInputProps extends Omit<TextInputProps, 'type' | 'rightAction'> {
  /**
   * Valor do atributo autoComplete.
   * Padrão: 'current-password'. Use 'new-password' para cadastros e troca de senha.
   */
  autoComplete?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      icon = <Lock size={20} aria-hidden="true" />,
      autoComplete = 'current-password',
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleToggle = () => {
      setIsVisible((prev) => !prev);
    };

    const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
      // Impede que o clique do mouse retire o foco do campo de texto
      event.preventDefault();
    };

    const combinedClassName = [styles.passwordWrapper, className].filter(Boolean).join(' ');

    return (
      <TextInput
        ref={ref}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        icon={icon}
        disabled={disabled}
        className={combinedClassName}
        rightAction={
          <button
            type="button"
            onClick={handleToggle}
            onMouseDown={handleMouseDown}
            className={styles.toggleButton}
            aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={isVisible}
            disabled={disabled}
            tabIndex={0}
          >
            {isVisible ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
