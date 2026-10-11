import { fireEvent, render, screen } from '@testing-library/react';
import { CourseDetailModal } from './CourseDetailModal';

describe('CourseDetailModal', () => {
  it('closes through Escape, backdrop and close button', () => {
    const onClose = vi.fn();

    render(
      <CourseDetailModal onClose={onClose}>
        <p>Conteúdo do curso</p>
      </CourseDetailModal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByTestId('course-detail-backdrop'));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when the modal content is clicked', () => {
    const onClose = vi.fn();

    render(
      <CourseDetailModal onClose={onClose}>
        <p>Conteúdo do curso</p>
      </CourseDetailModal>,
    );

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks background scroll while open and restores it on close', () => {
    const { unmount } = render(
      <CourseDetailModal onClose={vi.fn()}>
        <p>Conteúdo do curso</p>
      </CourseDetailModal>,
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });
});
