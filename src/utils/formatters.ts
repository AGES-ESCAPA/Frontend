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

/** Buffer `hhmmss`: a máscara de duração vai até 99:59:59. */
const DURATION_MASK_MAX_DIGITS = 6;
const DURATION_MASK_MAX_SECONDS = 99 * 3600 + 59 * 60 + 59;

/**
 * Extrai os dígitos da máscara de duração, sem zeros à esquerda e com no máximo 6.
 * @example extractDurationMaskDigits('00:32') // → '32'
 */
export const extractDurationMaskDigits = (value: string): string =>
  value.replace(/\D/g, '').replace(/^0+/, '').slice(0, DURATION_MASK_MAX_DIGITS);

/**
 * Formata o buffer da direita para a esquerda, como um cronômetro: os dois
 * últimos dígitos são segundos, os dois anteriores minutos e o resto horas.
 * @example formatDurationMaskFromDigits('32') // → '00:32'
 * @example formatDurationMaskFromDigits('1240') // → '12:40'
 * @example formatDurationMaskFromDigits('10530') // → '1:05:30'
 */
export const formatDurationMaskFromDigits = (digits: string): string => {
  const clean = extractDurationMaskDigits(digits);
  if (!clean) return '';

  const padded = clean.padStart(4, '0');
  const seconds = padded.slice(-2);
  const minutes = padded.slice(-4, -2);
  const hours = padded.slice(0, -4);

  return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

/** Unidades exibidas pela máscara: `h:min:seg` a partir de uma hora, senão `min:seg`. */
export const getDurationMaskUnits = (digits: string): string =>
  extractDurationMaskDigits(digits).length > 4 ? 'h:min:seg' : 'min:seg';

/**
 * Converte segundos no buffer da máscara, limitado a 99:59:59.
 * @example durationSecondsToDigitBuffer(32) // → '32'
 * @example durationSecondsToDigitBuffer(3930) // → '10530'
 */
export const durationSecondsToDigitBuffer = (totalSeconds: number): string => {
  const safeSeconds = Math.min(Math.max(0, Math.floor(totalSeconds)), DURATION_MASK_MAX_SECONDS);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return extractDurationMaskDigits(
    `${hours}${String(minutes).padStart(2, '0')}${String(seconds).padStart(2, '0')}`,
  );
};

/**
 * Converte o buffer da máscara em segundos.
 * Retorna `null` quando está vazio ou quando minutos ou segundos passam de 59.
 */
export const parseDurationDigitBuffer = (digits: string): number | null => {
  const clean = extractDurationMaskDigits(digits);
  if (!clean) return null;

  const padded = clean.padStart(DURATION_MASK_MAX_DIGITS, '0');
  const hours = Number(padded.slice(0, 2));
  const minutes = Number(padded.slice(2, 4));
  const seconds = Number(padded.slice(4));

  if (minutes > 59 || seconds > 59) return null;

  return hours * 3600 + minutes * 60 + seconds;
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
 * Formata segundos como tempo do player: "mm:ss" (minutos sempre com dois dígitos)
 * e "h:mm:ss" a partir de uma hora. Valores negativos ou inválidos viram "00:00".
 * @example formatTime(551) // → "09:11"
 * @example formatTime(3725) // → "1:02:05"
 */
export const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');

  if (hours === 0) return `${minutes}:${seconds}`;
  return `${hours}:${minutes}:${seconds}`;
};

export const formatWorkload = (durationTime: number | null): string => {
  if (durationTime === null || durationTime <= 0) return '0min';

  const hours = Math.floor(durationTime / 60);
  const minutes = durationTime % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};

/**
 * Formata uma data no formato ISO (`yyyy-MM-dd`, como o `LocalDate` do
 * backend serializa) por extenso, em português.
 *
 * Monta a data com os componentes locais em vez de `new Date(iso)` porque
 * esse construtor interpreta strings `yyyy-MM-dd` como UTC meia-noite, o que
 * pode exibir o dia anterior em fusos horários negativos (ex.: Brasil).
 * @example formatLongDate('2026-08-21') // → "21 de agosto de 2026"
 */
export const formatLongDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
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
 * Formata um valor em reais (não em centavos) no mesmo padrão numérico usado
 * por `maskCurrencyInput` — sem o símbolo "R$", pra preencher um campo de
 * formulário que já tem esse prefixo como addon visual.
 * @example formatDecimalInput(499) // → "499,00"
 */
export const formatDecimalInput = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Máscara de valor monetário no padrão de mercado: o usuário só digita
 * números, e eles entram da direita pra esquerda como centavos — digitar "1"
 * mostra "0,01", mais um "0" mostra "0,10", mais um "0" mostra "1,00", e assim
 * por diante. Qualquer caractere que não seja dígito (inclusive o que a
 * própria máscara insere, como o separador de milhar e a vírgula) é
 * descartado antes de recalcular o valor — então funciona tanto ao digitar
 * quanto ao apagar (backspace) o último dígito exibido.
 * @example maskCurrencyInput("100") // → "1,00"
 * @example maskCurrencyInput("150000") // → "1.500,00"
 */
export const maskCurrencyInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return '';

  const cents = Number(digits);
  return formatDecimalInput(cents / 100);
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

const COURSE_CODE_STOP_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'para',
  'o',
  'a',
  'os',
  'as',
]);

/**
 * Gera o código de duas letras exibido na coluna "Curso" da gestão administrativa.
 * @example toCourseCode("Atendimento de Excelencia em Hospedagem") // → "AE"
 */
export const toCourseCode = (title: string): string => {
  const words = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !COURSE_CODE_STOP_WORDS.has(word.toLowerCase()));

  if (words.length === 0) return '--';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
};

/**
 * Formata a versão major/minor do curso no padrão da tabela administrativa.
 * @example formatCourseVersion(1, 2) // → "v1.2"
 */
export const formatCourseVersion = (
  majorVersion: number | null,
  minorVersion: number | null,
): string => `v${majorVersion ?? 0}.${minorVersion ?? 0}`;

/**
 * Formata uma data e hora sem fuso, como o backend serializa um `LocalDateTime`
 * (ex.: "2026-10-24T15:32:49.461540389"), por extenso e em português. O JavaScript só lê
 * milissegundos, então as casas decimais a mais são descartadas; entrada inválida vira "".
 * @example formatDateTime('2026-10-24T15:32:49.461540389') // → "24 de outubro de 2026 às 15:32"
 */
export const formatDateTime = (localDateTime: string): string => {
  const date = new Date(localDateTime.replace(/(\.\d{3})\d+$/, '$1'));
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
};

const COMPACT_PT_BR_FORMATTER = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const toSafeCount = (count: number): number =>
  Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;

/**
 * Arredonda para baixo na casa decimal que a notação compacta mostra (4.860 -> 4.800, "4,8 mil"):
 * o Intl arredonda para o mais próximo e faria 4.960 virar "5 mil", mais do que o real.
 */
const floorToCompactPrecision = (count: number): number => {
  const step = 10 ** (Math.floor(Math.log10(count) / 3) * 3 - 1);
  return Math.floor(count / step) * step;
};

/**
 * Formata contagens inteiras de matrículas:
 * - Abaixo de 1.000: número integral (ex: 850 -> "850")
 * - A partir de 1.000: notação compacta pt-BR, sempre arredondada para baixo (ex: 4960 -> "4,9 mil")
 */
export const formatCompactEnrollmentCount = (count: number): string => {
  const safeCount = toSafeCount(count);

  if (safeCount < 1000) {
    return safeCount.toLocaleString('pt-BR');
  }

  // Remove espaço não-quebrável (\u00a0) gerado pelo Intl em alguns ambientes (Node/jsdom)
  // para garantir comparação consistente em tela e testes ("4,8 mil").
  return COMPACT_PT_BR_FORMATTER.format(floorToCompactPrecision(safeCount)).replace(/\u00a0/g, ' ');
};

/**
 * Gera a linha de apoio do card "Curso Mais Acessado". O "Mais de" só aparece quando a notação
 * compacta esconde parte do número; nos demais casos a contagem é exata.
 * Ex: 4820 -> "Mais de 4,8 mil matrículas" | 4800 -> "4,8 mil matrículas" | 1 -> "1 matrícula"
 */
export const formatMostAccessedCourseSubtitle = (enrollments: number): string => {
  const safeCount = toSafeCount(enrollments);
  const formatted = formatCompactEnrollmentCount(safeCount);
  const noun = safeCount === 1 ? 'matrícula' : 'matrículas';
  const isApproximate = safeCount >= 1000 && floorToCompactPrecision(safeCount) < safeCount;

  return isApproximate ? `Mais de ${formatted} ${noun}` : `${formatted} ${noun}`;
};
