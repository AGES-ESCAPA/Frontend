import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CourseFormField } from '@/types/course';
import { BasicInfoCard } from './BasicInfoCard';

vi.mock('./CoverImageField', () => ({
  CoverImageField: ({ onChange }: { onChange: (url: string) => void }) => (
    <button type="button" onClick={() => onChange('https://cdn.escapa.com/capa.jpg')}>
      Simular capa
    </button>
  ),
}));

const defaultProps = {
  title: '',
  teaserVideoUrl: '',
  shortDescription: '',
  thumbnailUrl: '',
  onFieldChange: vi.fn<[CourseFormField, string]>(),
  onCoverUploadingChange: vi.fn(),
};

describe('BasicInfoCard', () => {
  it('forwards field changes from the text inputs', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<[CourseFormField, string]>();

    render(<BasicInfoCard {...defaultProps} onFieldChange={onFieldChange} />);

    await user.type(screen.getByLabelText(/título/i), 'Novo curso');
    expect(onFieldChange).toHaveBeenCalledWith('title', expect.any(String));

    await user.type(screen.getByLabelText(/url vídeo teaser/i), 'https://vimeo.com/123');
    expect(onFieldChange).toHaveBeenCalledWith('teaserVideoUrl', expect.any(String));

    await user.type(screen.getByLabelText(/resumo curto/i), 'Resumo');
    expect(onFieldChange).toHaveBeenCalledWith('shortDescription', expect.any(String));
  });

  it('forwards thumbnail updates from the cover field', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<[CourseFormField, string]>();

    render(<BasicInfoCard {...defaultProps} onFieldChange={onFieldChange} />);

    await user.click(screen.getByRole('button', { name: 'Simular capa' }));

    expect(onFieldChange).toHaveBeenCalledWith('thumbnailUrl', 'https://cdn.escapa.com/capa.jpg');
  });
});
