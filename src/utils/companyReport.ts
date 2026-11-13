import type { EmployeeProgress } from '@/types/companyReport';

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const formatDecimal = (value: number): string =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/**
 * Porcentagem com até uma casa decimal.
 * @example formatPercent(78.4) // → "78,4%"
 * @example formatPercent(89) // → "89%"
 */
export const formatPercent = (value: number): string => `${formatDecimal(value)}%`;

/**
 * Horas com até uma casa decimal.
 * @example formatHours(12.6) // → "12,6h"
 */
export const formatHours = (value: number): string => `${formatDecimal(value)}h`;

/**
 * Mês abreviado a partir de `YYYY-MM`. Texto fora do formato volta como veio.
 * @example formatMonthLabel('2026-03') // → "Mar"
 */
export const formatMonthLabel = (month: string): string => {
  const match = /^\d{4}-(\d{2})$/.exec(month);
  const index = match ? Number(match[1]) - 1 : -1;

  return MONTH_ABBREVIATIONS[index] ?? month;
};

const pad = (value: number): string => String(value).padStart(2, '0');

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Último acesso relativo a `now`: "Hoje, 09:15", "Ontem, 16:40" e, antes disso, "18 Ago 2026".
 * Recebe um `LocalDateTime` sem fuso, lido no fuso do navegador.
 * @example formatLastAccess('2026-08-18T09:15:00', new Date(2026, 10, 10)) // → "18 Ago 2026"
 */
export const formatLastAccess = (lastAccessAt: string | null, now: Date): string => {
  if (lastAccessAt === null) return 'Nunca acessou';

  const date = new Date(lastAccessAt.replace(/(\.\d{3})\d+$/, '$1'));
  if (Number.isNaN(date.getTime())) return '—';

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  // Arredonda para não errar o dia nas trocas de horário de verão.
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_IN_MS);

  if (daysAgo === 0) return `Hoje, ${time}`;
  if (daysAgo === 1) return `Ontem, ${time}`;

  return `${pad(date.getDate())} ${MONTH_ABBREVIATIONS[date.getMonth()]} ${date.getFullYear()}`;
};

/** O curso está concluído quando o progresso chega a 100%: a barra fica verde. */
export const isCompleted = (row: EmployeeProgress): boolean => row.progress >= 100;
