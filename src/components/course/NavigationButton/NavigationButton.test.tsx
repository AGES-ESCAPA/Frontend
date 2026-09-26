import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LessonRef } from '@/types/course';
import { NavigationButton, type NavigationButtonProps } from './NavigationButton';

const ACTUAL_LESSON: LessonRef = { id: 'lesson-2', title: 'Aula Atual' };
const TARGET_LESSON: LessonRef = { id: 'lesson-3', title: 'Próxima Aula da Trilha' };
const PREVIEW_URL = 'https://example.com/preview.mp4';

const renderButton = (props: Partial<NavigationButtonProps> = {}) => {
  const onNavigate = vi.fn();

  const result = render(
    <NavigationButton
      actualLesson={ACTUAL_LESSON}
      targetLesson={TARGET_LESSON}
      direction="next"
      onNavigate={onNavigate}
      {...props}
    />,
  );

  return { ...result, onNavigate };
};

describe('NavigationButton', () => {
  describe('rendering', () => {
    it('renders the next-lesson button with an accessible label naming the target lesson', () => {
      renderButton({ direction: 'next' });

      expect(
        screen.getByRole('button', { name: `Próxima aula: ${TARGET_LESSON.title}` }),
      ).toBeInTheDocument();
    });

    it('renders the previous-lesson button with an accessible label naming the target lesson', () => {
      renderButton({ direction: 'previous' });

      expect(
        screen.getByRole('button', { name: `Aula anterior: ${TARGET_LESSON.title}` }),
      ).toBeInTheDocument();
    });

    it('does not render when there is no lesson in that direction', () => {
      const { container } = renderButton({ targetLesson: null });

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('navigation', () => {
    it('calls onNavigate with the target lesson when the next button is clicked', async () => {
      const { onNavigate } = renderButton({ direction: 'next' });

      await userEvent.click(screen.getByRole('button', { name: /próxima aula/i }));

      expect(onNavigate).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith(TARGET_LESSON);
    });

    it('calls onNavigate with the target lesson when the previous button is clicked', async () => {
      const { onNavigate } = renderButton({ direction: 'previous' });

      await userEvent.click(screen.getByRole('button', { name: /aula anterior/i }));

      expect(onNavigate).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith(TARGET_LESSON);
    });
  });

  describe('preview error', () => {
    it('shows "Vídeo indisponível" when the preview fails to load', () => {
      const { container } = renderButton({ previewVideoUrl: PREVIEW_URL });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', PREVIEW_URL);
      fireEvent.error(video as HTMLVideoElement);

      expect(screen.getByRole('status')).toHaveTextContent('Vídeo indisponível');
    });

    it('keeps the button clickable after the preview fails to load', async () => {
      const { container, onNavigate } = renderButton({ previewVideoUrl: PREVIEW_URL });

      fireEvent.error(container.querySelector('video') as HTMLVideoElement);
      await userEvent.click(screen.getByRole('button', { name: /próxima aula/i }));

      expect(onNavigate).toHaveBeenCalledWith(TARGET_LESSON);
    });

    it('does not render a preview video when previewVideoUrl is not given', () => {
      const { container } = renderButton({ previewVideoUrl: undefined });

      expect(container.querySelector('video')).not.toBeInTheDocument();
    });

    it('clears a previous error when the preview URL changes', () => {
      const { container, rerender } = renderButton({ previewVideoUrl: PREVIEW_URL });

      fireEvent.error(container.querySelector('video') as HTMLVideoElement);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(
        <NavigationButton
          actualLesson={ACTUAL_LESSON}
          targetLesson={TARGET_LESSON}
          direction="next"
          onNavigate={vi.fn()}
          previewVideoUrl="https://example.com/other-preview.mp4"
        />,
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
