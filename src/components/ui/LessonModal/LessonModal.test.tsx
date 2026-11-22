import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { Lesson } from '@/types/lesson';
import { getVimeoVideoDuration } from '@services/vimeoService';
import { LessonModal } from './LessonModal';
import type { LessonModalProps } from './LessonModal';

vi.mock('@services/vimeoService', () => ({
  getVimeoVideoDuration: vi.fn(),
}));

const getVimeoVideoDurationMock = vi.mocked(getVimeoVideoDuration);

const existingLesson: Lesson = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: '1.3 Formulários e Validação em HTML',
  description: 'Nesta aula você vai aprender a criar formulários acessíveis.',
  type: 'video',
  videoUrl: 'https://youtube.com/watch?v=abc',
  durationInSeconds: 760,
  textContent: null,
  fileUrl: null,
  quizQuestions: [],
  isFreeSample: true,
  resources: [
    { id: 'resource-1', type: 'link', title: 'Artigo MDN', url: 'https://developer.mozilla.org' },
  ],
};

const renderModal = (props: Partial<LessonModalProps> = {}) => {
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();

  render(
    <LessonModal
      open
      onOpenChange={onOpenChange}
      moduleId="module-1"
      moduleName="Fundamentos da Web"
      moduleOrder={1}
      onSubmit={onSubmit}
      {...props}
    />,
  );

  return { onSubmit, onOpenChange };
};

describe('LessonModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Cabeçalho e modo de uso ──────────────────────────────────────
  it('should show the target module in the header when creating a lesson', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: /adicionar aula/i })).toBeInTheDocument();
    expect(screen.getByText('Módulo 1 · Fundamentos da Web')).toBeInTheDocument();
  });

  it('should pre-fill the fields when editing an existing lesson', () => {
    renderModal({ lesson: existingLesson });

    expect(screen.getByRole('dialog', { name: /editar aula/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/título da aula/i)).toHaveValue(existingLesson.title);
    expect(screen.getByLabelText(/url do vídeo/i)).toHaveValue(existingLesson.videoUrl);
    expect(screen.getByLabelText(/duração/i)).toHaveValue('12:40');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText(/título do material 1/i)).toHaveValue('Artigo MDN');
  });

  // ── Seletor de tipo de aula ──────────────────────────────────────
  it('should swap the type-specific fields when another lesson type is picked', async () => {
    renderModal();

    expect(screen.getByLabelText(/url do vídeo/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Texto' }));

    expect(screen.queryByLabelText(/url do vídeo/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/conteúdo da aula/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Quiz' }));

    expect(screen.queryByLabelText(/conteúdo da aula/i)).not.toBeInTheDocument();
    expect(screen.getByText(/perguntas do quiz/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar pergunta/i })).toBeInTheDocument();
  });

  it('should only offer the upload for a complementary file, without a URL field', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: /adicionar arquivo/i }));

    expect(screen.getByLabelText(/selecionar arquivo 1/i)).toHaveAttribute('type', 'file');
    expect(screen.queryByLabelText(/url do arquivo/i)).not.toBeInTheDocument();
  });

  // ── Duração automática do Vimeo ──────────────────────────────────
  it('should fill the duration from Vimeo when a Vimeo URL is typed', async () => {
    getVimeoVideoDurationMock.mockResolvedValue(32);
    renderModal();

    await userEvent.type(screen.getByLabelText(/url do vídeo/i), 'https://vimeo.com/123456789');

    await waitFor(() => expect(screen.getByLabelText(/duração \(min:seg\)/i)).toHaveValue('00:32'));
    expect(screen.getByText('Duração preenchida a partir do Vimeo.')).toBeInTheDocument();
  });

  it('should show the hours when the Vimeo video passes one hour', async () => {
    getVimeoVideoDurationMock.mockResolvedValue(3930);
    renderModal();

    await userEvent.type(screen.getByLabelText(/url do vídeo/i), 'https://vimeo.com/123456789');

    await waitFor(() =>
      expect(screen.getByLabelText(/duração \(h:min:seg\)/i)).toHaveValue('1:05:30'),
    );
  });

  it('should keep the saved duration when editing a lesson with the same Vimeo URL', async () => {
    renderModal({ lesson: { ...existingLesson, videoUrl: 'https://vimeo.com/123456789' } });

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(getVimeoVideoDurationMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/duração/i)).toHaveValue('12:40');
  });

  // ── Validação ────────────────────────────────────────────────────
  it('should block the submit and report the required fields', async () => {
    const { onSubmit } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: /salvar aula/i }));

    expect(await screen.findByText('Informe o título da aula.')).toBeInTheDocument();
    expect(screen.getByText('Informe a URL do vídeo.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ── Persistência ─────────────────────────────────────────────────
  it('should submit the structured payload and close the modal', async () => {
    const { onSubmit, onOpenChange } = renderModal();

    await userEvent.type(screen.getByLabelText(/título da aula/i), 'Aula 1.3');
    await userEvent.type(screen.getByLabelText(/url do vídeo/i), 'https://youtube.com/watch?v=1');
    await userEvent.type(screen.getByLabelText(/duração/i), '1240');
    await userEvent.type(screen.getByLabelText(/descrição para os alunos/i), 'Resumo da aula.');
    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('button', { name: /salvar aula/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'module-1',
        title: 'Aula 1.3',
        description: 'Resumo da aula.',
        type: 'video',
        videoUrl: 'https://youtube.com/watch?v=1',
        durationInSeconds: 760,
        isFreeSample: true,
        resources: [],
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should keep the modal open and show the error when saving fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('API indisponível'));
    const { onOpenChange } = renderModal({ lesson: existingLesson, onSubmit });

    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText('API indisponível')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // ── Gerenciador de anexos e links ────────────────────────────────
  it('should add and remove complementary materials', async () => {
    const { onSubmit } = renderModal({ lesson: existingLesson });

    await userEvent.click(screen.getByRole('button', { name: /adicionar link/i }));
    await userEvent.type(screen.getByLabelText(/título do material 2/i), 'Post do blog');
    await userEvent.type(screen.getByLabelText(/link do material 2/i), 'https://blog.escapa.com');
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0].resources).toEqual([
      existingLesson.resources[0],
      expect.objectContaining({
        type: 'link',
        title: 'Post do blog',
        url: 'https://blog.escapa.com',
      }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: /remover material post do blog/i }));
    expect(screen.queryByLabelText(/título do material 2/i)).not.toBeInTheDocument();
  });

  // ── Cancelamento ─────────────────────────────────────────────────
  it('should close the modal without saving when cancelling', async () => {
    const { onSubmit, onOpenChange } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
