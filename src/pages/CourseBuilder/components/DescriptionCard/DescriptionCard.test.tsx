import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CourseFormField } from '@/types/course';
import { DescriptionCard } from './DescriptionCard';

const defaultProps = {
  description: '',
  onFieldChange: vi.fn<(field: CourseFormField, value: string) => void>(),
};

describe('DescriptionCard', () => {
  it('forwards description edits from the textarea', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<(field: CourseFormField, value: string) => void>();

    render(<DescriptionCard {...defaultProps} onFieldChange={onFieldChange} />);

    await user.type(screen.getByLabelText(/descrição completa/i), 'Texto da ementa');
    expect(onFieldChange).toHaveBeenCalledWith('description', expect.any(String));
  });

  it('wraps the selected text when a toolbar action is used', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<(field: CourseFormField, value: string) => void>();

    render(<DescriptionCard description="trecho" onFieldChange={onFieldChange} />);

    const textarea = screen.getByLabelText(/descrição completa/i) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 6);
    await user.click(screen.getByRole('button', { name: 'Negrito' }));

    expect(onFieldChange).toHaveBeenCalledWith('description', '**trecho**');
  });

  it.each([
    ['Itálico', 'trecho', '_trecho_'],
    ['Citação', 'citação', '> citação'],
    ['Link', 'texto', '[texto](https://)'],
    ['Código', 'fn', '`fn`'],
  ])('wraps selection with %s', async (toolName, selected, expected) => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<(field: CourseFormField, value: string) => void>();

    render(<DescriptionCard description={selected} onFieldChange={onFieldChange} />);

    const textarea = screen.getByLabelText(/descrição completa/i) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, selected.length);
    await user.click(screen.getByRole('button', { name: toolName }));

    expect(onFieldChange).toHaveBeenCalledWith('description', expected);
  });

  it('does not apply toolbar actions when disabled', async () => {
    const onFieldChange = vi.fn<(field: CourseFormField, value: string) => void>();

    render(<DescriptionCard description="trecho" disabled onFieldChange={onFieldChange} />);

    const bold = screen.getByRole('button', { name: 'Negrito' });
    expect(bold).toBeDisabled();
    await userEvent.click(bold);
    expect(onFieldChange).not.toHaveBeenCalled();
  });

  it('shows the description error when provided', () => {
    render(<DescriptionCard {...defaultProps} descriptionError="Preenchimento obrigatório." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Preenchimento obrigatório.');
  });
});
