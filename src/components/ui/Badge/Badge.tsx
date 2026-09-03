import type { CSSProperties } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

export type BadgeCategory =
  | 'marketing'
  | 'innovation'
  | 'hospitality'
  | 'ai'
  | 'basic'
  | 'intermediate'
  | 'advanced'
  | (string & Record<never, never>);

export interface BadgeProps {
  label?: string;

  category?: BadgeCategory;

  variant?: BadgeVariant;

  className?: string;

  style?: CSSProperties;
}

const CATEGORY_VARIANT_MAP: Record<string, BadgeVariant> = {
  marketing: 'secondary',
  innovation: 'info',
  hospitality: 'warning',
  ai: 'primary',
  basic: 'success',
  intermediate: 'secondary',
  advanced: 'error',
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  marketing: 'Marketing',
  innovation: 'Inovação',
  hospitality: 'Hospitalidade',
  ai: 'IA',
  basic: 'Básico',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
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

const resolveLabel = (category?: string, label?: string): string => {
  if (label) return label;

  const key = normalizeKey(category);
  return CATEGORY_LABEL_MAP[key] ?? category ?? '';
};

export const Badge = ({ label, category, variant, className = '', style }: BadgeProps) => {
  const resolvedVariant = resolveVariant(category, variant);
  const resolvedLabel = resolveLabel(category, label);

  return (
    <span
      className={`${styles.badge} ${styles[`variant-${resolvedVariant}`]} ${className}`.trim()}
      style={style}
    >
      {resolvedLabel}
    </span>
  );
};
