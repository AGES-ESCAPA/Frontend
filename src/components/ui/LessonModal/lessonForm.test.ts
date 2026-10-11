import { describe, it, expect } from 'vitest';
import type { Lesson } from '@/types/lesson';
import {
  buildLessonPayload,
  createLessonFormState,
  createResourceDraft,
  hasLessonFormErrors,
  validateLessonForm,
} from './lessonForm';

const videoLesson: Lesson = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: '1.3 Formulários e Validação em HTML',
  description: 'Nesta aula você vai aprender a criar formulários acessíveis.',
  type: 'video',
  videoUrl: 'https://youtube.com/watch?v=abc',
  durationInSeconds: 760,
  textContent: null,
  fileUrl: null,
  isFreeSample: true,
  resources: [
    { id: 'resource-1', type: 'link', title: 'Artigo MDN', url: 'https://developer.mozilla.org' },
  ],
};

describe('createLessonFormState', () => {
  it('should start empty for a new lesson', () => {
    const state = createLessonFormState();

    expect(state.title).toBe('');
    expect(state.type).toBe('video');
    expect(state.duration).toBe('');
    expect(state.isFreeSample).toBe(false);
    expect(state.resources).toHaveLength(0);
  });

  it('should pre-fill the form with an existing lesson', () => {
    const state = createLessonFormState(videoLesson);

    expect(state.title).toBe(videoLesson.title);
    expect(state.videoUrl).toBe('https://youtube.com/watch?v=abc');
    expect(state.duration).toBe('1240');
    expect(state.isFreeSample).toBe(true);
    expect(state.resources).toEqual([{ ...videoLesson.resources[0], file: null }]);
  });
});

describe('validateLessonForm', () => {
  it('should require title and video URL for a video lesson', () => {
    const errors = validateLessonForm(createLessonFormState());

    expect(errors.title).toBeDefined();
    expect(errors.videoUrl).toBeDefined();
    expect(hasLessonFormErrors(errors)).toBe(true);
  });

  it('should reject a malformed duration', () => {
    const state = { ...createLessonFormState(videoLesson), duration: '1299' };

    expect(validateLessonForm(state).duration).toBeDefined();
  });

  it('should require the article content for a text lesson', () => {
    const state = { ...createLessonFormState(), type: 'text' as const, title: 'Aula em texto' };
    const errors = validateLessonForm(state);

    expect(errors.textContent).toBeDefined();
    expect(errors.videoUrl).toBeUndefined();
  });

  it('should accept a file lesson sent as upload, without URL', () => {
    const state = {
      ...createLessonFormState(),
      type: 'file' as const,
      title: 'Checklist de hospitalidade',
      file: new File(['conteudo'], 'checklist.pdf', { type: 'application/pdf' }),
    };

    expect(hasLessonFormErrors(validateLessonForm(state))).toBe(false);
  });

  it('should require title and link for each attached resource', () => {
    const draft = createResourceDraft('link');
    const state = { ...createLessonFormState(videoLesson), resources: [{ ...draft }] };
    const errors = validateLessonForm(state);

    expect(errors.resources[draft.id]?.title).toBeDefined();
    expect(errors.resources[draft.id]?.url).toBeDefined();
  });

  it('should pass with a fully filled video lesson', () => {
    expect(hasLessonFormErrors(validateLessonForm(createLessonFormState(videoLesson)))).toBe(false);
  });
});

describe('buildLessonPayload', () => {
  it('should convert the duration to seconds and keep only the fields of the chosen type', () => {
    const payload = buildLessonPayload(createLessonFormState(videoLesson), 'module-1');

    expect(payload).toMatchObject({
      moduleId: 'module-1',
      type: 'video',
      videoUrl: 'https://youtube.com/watch?v=abc',
      durationInSeconds: 760,
      textContent: null,
      fileUrl: null,
      isFreeSample: true,
    });
    expect(payload.resources).toEqual(videoLesson.resources);
    expect(payload.uploads).toEqual([]);
  });

  it('should discard fields that do not belong to the chosen type', () => {
    const state = { ...createLessonFormState(videoLesson), type: 'text' as const };
    state.textContent = 'Artigo completo da aula.';

    const payload = buildLessonPayload(state, 'module-1');

    expect(payload.videoUrl).toBeNull();
    expect(payload.durationInSeconds).toBeNull();
    expect(payload.textContent).toBe('Artigo completo da aula.');
  });

  it('should collect local files in uploads, tagging the owning resource', () => {
    const lessonFile = new File(['pdf'], 'aula.pdf', { type: 'application/pdf' });
    const resourceFile = new File(['xlsx'], 'planilha.xlsx');
    const draft = { ...createResourceDraft('file'), title: 'Planilha', file: resourceFile };

    const state = {
      ...createLessonFormState(),
      type: 'file' as const,
      title: 'Material de apoio',
      file: lessonFile,
      resources: [draft],
    };

    expect(buildLessonPayload(state, 'module-1').uploads).toEqual([
      { file: lessonFile },
      { resourceId: draft.id, file: resourceFile },
    ]);
  });
});
