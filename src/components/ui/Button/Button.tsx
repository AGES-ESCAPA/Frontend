import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'ghost' | 'secondary';

type ButtonCommonProps = {
  variant?: ButtonVariant;
  className?: string;
};

export type ButtonProps = ButtonCommonProps &
  (
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
    | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  );

export const Button: FC<ButtonProps> = (props) => {
  const { variant = 'secondary', className = '', ...elementProps } = props;
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  if ('href' in elementProps) {
    const { href, ...anchorProps } = elementProps as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return <a {...anchorProps} href={href} className={classes} />;
  }

  return (
    <button {...(elementProps as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes} />
  );
};
