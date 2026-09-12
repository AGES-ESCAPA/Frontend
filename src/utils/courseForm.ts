import { formatDecimalInput } from '@utils/formatters';
import { COURSE_DIFFICULTIES } from '@/types/course';
import type {
  CourseDetail,
  CourseDifficulty,
  CourseFormErrors,
  CourseFormValues,
  CoursePayload,
  CourseStatus,
  CourseValidationMode,
} from '@/types/course';

export const COURSE_FORM_INITIAL_VALUES: CourseFormValues = {
  title: '',
  teaserVideoUrl: '',
  shortDescription: '',
  description: '',
  category: '',
  difficulty: '',
  durationTime: '',
  deadline: '',
  price: '',
};

const REQUIRED_MESSAGE = 'Preenchimento obrigatório.';

const TEASER_URL_PATTERN =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)[\w-]{11}|youtu\.be\/[\w-]{11}|(?:player\.)?vimeo\.com\/(?:video\/)?\d+)(?:[?&#/].*)?$/i;

/**
 * Carga horária e prazo são inteiros simples, sem separador. Preço vem da
 * máscara monetária (`maskCurrencyInput`), sempre no formato "1.500,00": a
 * vírgula é o separador decimal e, quando ela aparece, todo ponto é
 * separador de milhar e é descartado antes de converter para número.
 */
const toNumber = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Aceita tanto o valor canônico ("INTERMEDIARIO") quanto o rótulo acentuado vindo do banco. */
const toDifficulty = (raw: string): CourseDifficulty | null => {
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  const match = COURSE_DIFFICULTIES.find((option) => option.value === normalized);
  return match ? match.value : null;
};

const trimmedOrNull = (raw: string): string | null => {
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
};

const numberToInput = (value: number | null): string =>
  typeof value === 'number' ? String(value) : '';

/**
 * Regra de inteiro positivo compartilhada por Carga Horária e Prazo: o campo
 * pode ser opcional, mas quando preenchido não aceita zero, negativo ou fração.
 */
const validatePositiveInteger = (raw: string, required: boolean): string | undefined => {
  if (raw.trim() === '') {
    return required ? REQUIRED_MESSAGE : undefined;
  }

  const parsed = toNumber(raw);
  if (parsed === null) return 'Informe um número válido.';
  if (parsed <= 0) return 'Informe um valor maior que zero.';
  if (!Number.isInteger(parsed)) return 'Informe um número inteiro de dias ou horas.';

  return undefined;
};

export const validateCourseForm = (
  values: CourseFormValues,
  mode: CourseValidationMode,
): CourseFormErrors => {
  const errors: CourseFormErrors = {};
  const isPublish = mode === 'publish';

  if (values.title.trim() === '') {
    errors.title = REQUIRED_MESSAGE;
  }

  if (
    values.teaserVideoUrl.trim() !== '' &&
    !TEASER_URL_PATTERN.test(values.teaserVideoUrl.trim())
  ) {
    errors.teaserVideoUrl = 'Informe um link válido do YouTube ou Vimeo.';
  }

  const deadlineError = validatePositiveInteger(values.deadline, false);
  if (deadlineError) {
    errors.deadline = deadlineError;
  }

  // Carga horária e preço não são obrigatórios no rascunho, mas se o usuário
  // já preencheu algo, o formato/faixa é validado nos dois modos — senão um
  // valor negativo, zero ou não numérico passa direto pro payload no rascunho,
  // driblando a mesma regra que é exigida ao publicar.
  const durationError = validatePositiveInteger(values.durationTime, isPublish);
  if (durationError) {
    errors.durationTime = durationError;
  }

  if (values.price.trim() === '') {
    if (isPublish) {
      errors.price = REQUIRED_MESSAGE;
    }
  } else {
    const price = toNumber(values.price);
    if (price === null) {
      errors.price = 'Informe um valor válido.';
    } else if (price <= 0) {
      errors.price = 'Informe um preço maior que zero.';
    }
  }

  if (!isPublish) {
    return errors;
  }

  if (values.category.trim() === '') {
    errors.category = 'Selecione uma categoria.';
  }

  if (toDifficulty(values.difficulty) === null) {
    errors.difficulty = 'Selecione um nível de dificuldade.';
  }

  if (values.shortDescription.trim() === '') {
    errors.shortDescription = REQUIRED_MESSAGE;
  }

  if (values.description.trim() === '') {
    errors.description = REQUIRED_MESSAGE;
  }

  return errors;
};

export const hasCourseFormErrors = (errors: CourseFormErrors): boolean =>
  Object.values(errors).some((message) => message !== undefined);

export const buildCoursePayload = (
  values: CourseFormValues,
  status: CourseStatus,
): CoursePayload => ({
  title: values.title.trim(),
  category: trimmedOrNull(values.category),
  level: toDifficulty(values.difficulty),
  description: trimmedOrNull(values.description),
  shortDescription: trimmedOrNull(values.shortDescription),
  teaserVideoUrl: trimmedOrNull(values.teaserVideoUrl),
  durationTime: toNumber(values.durationTime),
  deadline: toNumber(values.deadline),
  price: toNumber(values.price),
  status,
});

export const courseDetailToFormValues = (course: CourseDetail): CourseFormValues => ({
  title: course.title ?? '',
  teaserVideoUrl: course.teaserVideoUrl ?? '',
  shortDescription: course.shortDescription ?? '',
  description: course.description ?? '',
  category: course.category ?? '',
  difficulty: toDifficulty(course.level ?? '') ?? '',
  durationTime: numberToInput(course.durationTime),
  deadline: numberToInput(course.deadline),
  price: typeof course.price === 'number' ? formatDecimalInput(course.price) : '',
});
