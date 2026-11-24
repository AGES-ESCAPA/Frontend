import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LessonResourceDraft } from './lessonForm';
import { LessonResources } from './LessonResources';

const linkResource: LessonResourceDraft = {
  id: 'res-1',
  type: 'link',
  title: 'Artigo MDN',
  url: 'https://developer.mozilla.org',
  file: null,
};

describe('LessonResources', () => {
  it('offers actions to add resources and edits fields', async () => {
    const onAdd = vi.fn();
    const onChange = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(
      <LessonResources
        idPrefix="lesson"
        resources={[linkResource]}
        errors={{}}
        onAdd={onAdd}
        onChange={onChange}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }));
    expect(onAdd).toHaveBeenCalledWith('link');

    await user.click(screen.getByRole('button', { name: 'Adicionar arquivo' }));
    expect(onAdd).toHaveBeenCalledWith('file');

    const titleInput = screen.getByLabelText('Título do material 1');
    await user.clear(titleInput);
    await user.type(titleInput, 'Novo título');
    expect(onChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Remover material Artigo MDN' }));
    expect(onRemove).toHaveBeenCalledWith('res-1');
  });

  it('shows field-level errors for invalid resources', () => {
    render(
      <LessonResources
        idPrefix="lesson"
        resources={[{ ...linkResource, title: '', url: '' }]}
        errors={{ 'res-1': { title: 'Informe o título do material.', url: 'Informe o link.' } }}
        onAdd={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Informe o título do material.')).toBeInTheDocument();
    expect(screen.getByText('Informe o link.')).toBeInTheDocument();
  });
});
