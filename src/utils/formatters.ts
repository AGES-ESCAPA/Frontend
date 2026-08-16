/**
 * utils/formatters.ts
 *
 * Funções puras de formatação de dados.
 * Todas as funções aqui devem ser stateless e testáveis de forma isolada.
 */

/**
 * Converte uma duração em segundos para o formato "Xh Ymin".
 * @example formatDuration(3661) // → "1h 01min"
 */
export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) return '0min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
};

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * @example formatCurrency(1500) // → "R$ 1.500,00"
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Capitaliza a primeira letra de cada palavra em uma string.
 * @example toTitleCase("turismo de luxo") // → "Turismo De Luxo"
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Trunca uma string para um comprimento máximo, adicionando "..." no final.
 * @example truncate("texto longo", 8) // → "texto..."
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};
