/**
 * lessonForm.ts
 *
 * Estado, validação e serialização do formulário de aula. Mantido fora do
 * componente para que as regras de US-07/US-13 sejam testáveis isoladamente.
 */
import type {
  Lesson,
  LessonAttachmentUpload,
  LessonPayload,
  LessonResource,
  LessonResourceType,
  LessonType,
  QuizQuestion,
} from '@/types/lesson';
import { durationSecondsToDigitBuffer, parseDurationDigitBuffer } from '@utils/formatters';

/** Material complementar em edição: pode carregar um arquivo ainda não enviado. */
export interface LessonResourceDraft extends LessonResource {
  file: File | null;
}

export interface LessonQuizOptionDraft {
  id: string;
  text: string;
  correct: boolean;
}

export interface LessonQuizQuestionDraft {
  id: string;
  prompt: string;
  options: LessonQuizOptionDraft[];
}

const createQuizId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createQuizOption = (correct = false): LessonQuizOptionDraft => ({
  id: createQuizId(),
  text: '',
  correct,
});

export const createQuizQuestion = (): LessonQuizQuestionDraft => ({
  id: createQuizId(),
  prompt: '',
  options: [createQuizOption(true), createQuizOption(false)],
});

export interface LessonFormState {
  title: string;
  description: string;
  type: LessonType;
  videoUrl: string;
  /** Buffer numérico da máscara de duração (até 6 dígitos, ex.: "1240" → 12:40, "10530" → 1:05:30). */
  duration: string;
  textContent: string;
  fileUrl: string;
  file: File | null;
  quizQuestions: LessonQuizQuestionDraft[];
  isFreeSample: boolean;
  resources: LessonResourceDraft[];
}

export interface LessonResourceErrors {
  title?: string;
  url?: string;
}

export interface LessonFormErrors {
  title?: string;
  videoUrl?: string;
  duration?: string;
  textContent?: string;
  fileUrl?: string;
  quizQuestions?: string;
  /** Erros por material complementar, indexados pelo `id` do rascunho. */
  resources: Record<string, LessonResourceErrors>;
}

export const EMPTY_LESSON_FORM_ERRORS: LessonFormErrors = { resources: {} };

const createResourceId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isValidUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const createResourceDraft = (type: LessonResourceType): LessonResourceDraft => ({
  id: createResourceId(),
  type,
  title: '',
  url: '',
  file: null,
});

const toQuizDrafts = (questions: QuizQuestion[] | undefined): LessonQuizQuestionDraft[] =>
  (questions ?? []).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text,
      correct: Boolean(option.correct),
    })),
  }));

/** Monta o estado inicial: vazio na criação, pré-preenchido na edição. */
export const createLessonFormState = (lesson?: Lesson | null): LessonFormState => {
  const type = lesson?.type === 'file' ? 'text' : (lesson?.type ?? 'video');
  return {
    title: lesson?.title ?? '',
    description: lesson?.description ?? '',
    type,
    videoUrl: lesson?.videoUrl ?? '',
    duration:
      lesson?.durationInSeconds != null
        ? durationSecondsToDigitBuffer(lesson.durationInSeconds)
        : '',
    textContent: lesson?.textContent ?? '',
    fileUrl: lesson?.fileUrl ?? '',
    file: null,
    quizQuestions:
      type === 'quiz'
        ? toQuizDrafts(lesson?.quizQuestions).length > 0
          ? toQuizDrafts(lesson?.quizQuestions)
          : [createQuizQuestion()]
        : [],
    isFreeSample: lesson?.isFreeSample ?? false,
    resources: (lesson?.resources ?? []).map((resource) => ({ ...resource, file: null })),
  };
};

export const validateLessonForm = (state: LessonFormState): LessonFormErrors => {
  const errors: LessonFormErrors = { resources: {} };

  if (!state.title.trim()) {
    errors.title = 'Informe o título da aula.';
  }

  if (state.type === 'video') {
    const videoUrl = state.videoUrl.trim();
    if (!videoUrl) {
      errors.videoUrl = 'Informe a URL do vídeo.';
    } else if (!isValidUrl(videoUrl)) {
      errors.videoUrl = 'Informe uma URL válida, começando com https://.';
    }

    if (!state.duration.trim()) {
      errors.duration = 'Informe a duração do vídeo.';
    } else if (parseDurationDigitBuffer(state.duration) === null) {
      errors.duration = 'Minutos e segundos vão até 59 (ex.: 12:40 ou 1:05:30).';
    }
  }

  if (state.type === 'text' && !state.textContent.trim()) {
    errors.textContent = 'Escreva o conteúdo da aula.';
  }

  if (state.type === 'file' && !state.file && !state.fileUrl.trim()) {
    errors.fileUrl = 'Envie o arquivo da aula.';
  }

  if (state.type === 'quiz') {
    if (state.quizQuestions.length === 0) {
      errors.quizQuestions = 'Adicione pelo menos uma pergunta.';
    } else {
      const invalid = state.quizQuestions.some((question) => {
        if (!question.prompt.trim()) return true;
        if (question.options.length < 2) return true;
        if (question.options.filter((option) => option.correct).length !== 1) return true;
        return question.options.some((option) => !option.text.trim());
      });
      if (invalid) {
        errors.quizQuestions =
          'Cada pergunta precisa de enunciado, 2+ alternativas preenchidas e exatamente uma correta.';
      }
    }
  }

  state.resources.forEach((resource) => {
    const resourceErrors: LessonResourceErrors = {};
    const url = resource.url.trim();

    if (!resource.title.trim()) {
      resourceErrors.title = 'Informe o título do material.';
    }

    if (resource.type === 'file') {
      if (!resource.file && !url) {
        resourceErrors.url = 'Envie o arquivo.';
      }
    } else if (!url) {
      resourceErrors.url = 'Informe o link.';
    } else if (!isValidUrl(url)) {
      resourceErrors.url = 'Informe uma URL válida, começando com https://.';
    }

    if (resourceErrors.title || resourceErrors.url) {
      errors.resources[resource.id] = resourceErrors;
    }
  });

  return errors;
};

export const hasLessonFormErrors = (errors: LessonFormErrors): boolean =>
  Boolean(
    errors.title ||
    errors.videoUrl ||
    errors.duration ||
    errors.textContent ||
    errors.fileUrl ||
    errors.quizQuestions ||
    Object.keys(errors.resources).length > 0,
  );

/**
 * Converte o formulário no contrato enviado à API: apenas os campos do tipo
 * escolhido são preenchidos e os arquivos locais viajam em `uploads`.
 */
export const buildLessonPayload = (state: LessonFormState, moduleId: string): LessonPayload => {
  const resources: LessonResource[] = state.resources.map((resource) => ({
    id: resource.id,
    type: resource.type,
    title: resource.title.trim(),
    url: resource.url.trim(),
  }));

  const uploads: LessonAttachmentUpload[] = [];
  if (state.type === 'file' && state.file) {
    uploads.push({ file: state.file });
  }
  state.resources.forEach((resource) => {
    if (resource.file) {
      uploads.push({ resourceId: resource.id, file: resource.file });
    }
  });

  const isVideo = state.type === 'video';

  return {
    moduleId,
    title: state.title.trim(),
    description: state.description.trim(),
    type: state.type,
    videoUrl: isVideo ? state.videoUrl.trim() : null,
    durationInSeconds: isVideo ? parseDurationDigitBuffer(state.duration) : null,
    textContent: state.type === 'text' ? state.textContent.trim() : null,
    fileUrl: state.type === 'file' ? state.fileUrl.trim() || null : null,
    quizQuestions:
      state.type === 'quiz'
        ? state.quizQuestions.map((question) => ({
            id: question.id,
            prompt: question.prompt.trim(),
            options: question.options.map((option) => ({
              id: option.id,
              text: option.text.trim(),
              correct: option.correct,
            })),
          }))
        : [],
    isFreeSample: state.isFreeSample,
    resources,
    uploads,
  };
};
