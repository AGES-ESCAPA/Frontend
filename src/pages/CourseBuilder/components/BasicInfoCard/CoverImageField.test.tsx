import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { uploadCourseThumbnail } from '@services/courseService';
import { CoverImageField } from './CoverImageField';

vi.mock('@services/courseService', () => ({
  uploadCourseThumbnail: vi.fn(),
}));

describe('CoverImageField', () => {
  beforeEach(() => {
    vi.mocked(uploadCourseThumbnail).mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:capa');
    URL.revokeObjectURL = vi.fn();
  });

  it('rejects a file that is not a jpeg, png or webp', async () => {
    const onChange = vi.fn();
    render(<CoverImageField thumbnailUrl="" onChange={onChange} onUploadingChange={vi.fn()} />);

    const file = new File(['doc'], 'capa.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText(/imagem de capa/i), file, { applyAccept: false });

    expect(await screen.findByRole('alert')).toHaveTextContent('Use uma imagem JPEG, PNG ou WEBP.');
    expect(uploadCourseThumbnail).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the current cover when the user removes it', async () => {
    const onChange = vi.fn();
    render(
      <CoverImageField
        thumbnailUrl="https://cdn.escapa.com/courses/capa.jpg"
        onChange={onChange}
        onUploadingChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remover capa' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
