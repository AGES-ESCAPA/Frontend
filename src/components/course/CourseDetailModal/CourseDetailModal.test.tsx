import { fireEvent, render, screen } from '@testing-library/react';
import { CourseDetailModal } from './CourseDetailModal';

describe('CourseDetailModal', () => {
  it('closes through Escape, backdrop and close button', () => {
    const onClose = vi.fn();

    render(
      <CourseDetailModal title="IA Aplicada ao Turismo" onClose={onClose}>
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
      <CourseDetailModal title="IA Aplicada ao Turismo" onClose={onClose}>
        <p>Conteúdo do curso</p>
      </CourseDetailModal>,
    );

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
