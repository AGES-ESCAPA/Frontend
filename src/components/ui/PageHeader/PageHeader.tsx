import type { ElementType, ReactNode } from 'react';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  /** Texto em caixa alta acima do título (ex.: "ÁREA DO ALUNO • MEUS CURSOS"). */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  /** Id do título, para `aria-labelledby` de seções. */
  titleId?: string;
  /** Nível do título. Padrão: `h1`. */
  titleAs?: 'h1' | 'h2';
  className?: string;
}

export const PageHeader = ({
  title,
  eyebrow,
  subtitle,
  titleId,
  titleAs = 'h1',
  className = '',
}: PageHeaderProps) => {
  const TitleTag = titleAs as ElementType;

  return (
    <header className={`${styles.root} ${className}`.trim()}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <TitleTag id={titleId} className={styles.title}>
        {title}
      </TitleTag>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
  );
};
