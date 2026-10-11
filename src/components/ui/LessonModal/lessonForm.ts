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
} from '@/types/lesson';
import { durationSecondsToDigitBuffer, parseDurationDigitBuffer } from '@utils/formatters';

/** Material complementar em edição: pode carregar um arquivo ainda não enviado. */
export interface LessonResourceDraft extends LessonResource {
  file: File | null;
}

export interface LessonFormState {
  title: string;
  description: string;
  type: LessonType;
  videoUrl: string;
  /** Buffer numérico da máscara 000:00 (até 5 dígitos, ex.: "1240" → 012:40). */
  duration: string;
  textContent: string;
  fileUrl: string;
  file: File | null;
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

/** Monta o estado inicial: vazio na criação, pré-preenchido na edição. */
export const createLessonFormState = (lesson?: Lesson | null): LessonFormState => ({
  title: lesson?.title ?? '',
  description: lesson?.description ?? '',
  type: lesson?.type ?? 'video',
  videoUrl: lesson?.videoUrl ?? '',
  duration:
    lesson?.durationInSeconds != null ? durationSecondsToDigitBuffer(lesson.durationInSeconds) : '',
  textContent: lesson?.textContent ?? '',
  fileUrl: lesson?.fileUrl ?? '',
  file: null,
  isFreeSample: lesson?.isFreeSample ?? false,
  resources: (lesson?.resources ?? []).map((resource) => ({ ...resource, file: null })),
});

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

    if (state.duration.trim() && parseDurationDigitBuffer(state.duration) === null) {
      errors.duration = 'Use o formato 000:00 (ex.: 012:40).';
    }
  }

  if (state.type === 'text' && !state.textContent.trim()) {
    errors.textContent = 'Escreva o conteúdo da aula.';
  }

  if (state.type === 'file') {
    const fileUrl = state.fileUrl.trim();
    if (!fileUrl && !state.file) {
      errors.fileUrl = 'Envie um arquivo ou informe a URL do material.';
    } else if (fileUrl && !isValidUrl(fileUrl)) {
      errors.fileUrl = 'Informe uma URL válida, começando com https://.';
    }
  }

  state.resources.forEach((resource) => {
    const resourceErrors: LessonResourceErrors = {};
    const url = resource.url.trim();

    if (!resource.title.trim()) {
      resourceErrors.title = 'Informe o título do material.';
    }

    if (!url && !resource.file) {
      resourceErrors.url =
        resource.type === 'link' ? 'Informe o link.' : 'Envie o arquivo ou informe a URL.';
    } else if (url && !isValidUrl(url)) {
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
    isFreeSample: state.isFreeSample,
    resources,
    uploads,
  };
};
