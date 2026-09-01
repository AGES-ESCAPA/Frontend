import type { CSSProperties } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

export type BadgeCategory =
  | 'marketing'
  | 'inovacao'
  | 'hospitalidade'
  | 'ia'
  | 'inteligencia-artificial'
  | 'basico'
  | 'intermediario'
  | 'avancado'
  | (string & Record<never, never>);

export interface BadgeProps {
  label: string;

  category?: BadgeCategory;

  variant?: BadgeVariant;

  className?: string;

  style?: CSSProperties;
}

const CATEGORY_VARIANT_MAP: Record<string, BadgeVariant> = {
  marketing: 'secondary',
  inovacao: 'info',
  hospitalidade: 'warning',
  ia: 'primary',
  'inteligencia-artificial': 'primary',
  basico: 'success',
  intermediario: 'secondary',
  avancado: 'error',
};

const normalizeKey = (value?: string): string => {
  if (!value) return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
};

const resolveVariant = (category?: string, variant?: BadgeVariant): BadgeVariant => {
  if (variant) return variant;

  const key = normalizeKey(category);
  return CATEGORY_VARIANT_MAP[key] ?? 'neutral';
};

export const Badge = ({ label, category, variant, className = '', style }: BadgeProps) => {
  const resolvedVariant = resolveVariant(category, variant);

  return (
    <span
      className={`${styles.badge} ${styles[`variant-${resolvedVariant}`]} ${className}`.trim()}
      style={style}
    >
      {label}
    </span>
  );
};
