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

const TIMECODE_PATTERN = /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/;
const DURATION_MASK_PATTERN = /^\d{3}:\d{2}$/;

/** Extrai até 5 dígitos usados pela máscara de duração `000:00`. */
export const extractDurationMaskDigits = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 5);

/**
 * Formata dígitos crus no padrão `000:00` (mmm:ss).
 * Os dois últimos dígitos são sempre segundos quando há 4 ou mais.
 * @example formatDurationMaskFromDigits('1240') // → '012:40'
 */
export const formatDurationMaskFromDigits = (digits: string): string => {
  const clean = extractDurationMaskDigits(digits);
  if (!clean) return '';

  if (clean.length <= 3) {
    return `${clean.padStart(3, '0')}:00`;
  }

  const seconds = clean.slice(-2);
  const minutes = clean.slice(0, -2).padStart(3, '0');
  return `${minutes}:${seconds}`;
};

/**
 * Converte segundos para a máscara `000:00`.
 * @example formatSecondsToDurationMask(760) // → '012:40'
 */
export const formatSecondsToDurationMask = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(3, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Converte segundos no buffer numérico usado pela máscara (até 5 dígitos).
 * @example durationSecondsToDigitBuffer(760) // → '1240'
 */
export const durationSecondsToDigitBuffer = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}${String(seconds).padStart(2, '0')}`;
};

/**
 * Converte o buffer numérico da máscara em segundos.
 * Retorna `null` quando os segundos calculados passam de 59.
 */
export const parseDurationDigitBuffer = (digits: string): number | null => {
  const clean = extractDurationMaskDigits(digits);
  if (!clean) return null;

  return parseDurationMask(formatDurationMaskFromDigits(clean));
};

/**
 * Converte a máscara `000:00` em segundos.
 * Retorna `null` quando o formato é inválido ou os segundos passam de 59.
 */
export const parseDurationMask = (value: string): number | null => {
  const trimmed = value.trim();
  if (!DURATION_MASK_PATTERN.test(trimmed)) return null;

  const [minutesPart, secondsPart] = trimmed.split(':');
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart);

  if (seconds > 59) return null;

  return minutes * 60 + seconds;
};

/**
 * Converte um timecode "mm:ss" ou "hh:mm:ss" em segundos.
 * Retorna `null` quando o texto não está em um dos dois formatos.
 * @example parseTimecodeToSeconds("12:40") // → 760
 */
export const parseTimecodeToSeconds = (timecode: string): number | null => {
  const trimmed = timecode.trim();
  if (!TIMECODE_PATTERN.test(trimmed)) return null;

  const parts = trimmed.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

/**
 * Converte segundos no timecode "mm:ss" — ou "hh:mm:ss" a partir de uma hora.
 * @example formatSecondsToTimecode(760) // → "12:40"
 */
export const formatSecondsToTimecode = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours === 0) return `${minutes}:${paddedSeconds}`;
  return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
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
