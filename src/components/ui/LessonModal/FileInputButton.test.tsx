import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileInputButton } from './FileInputButton';

describe('FileInputButton', () => {
  it('calls onSelect with the chosen file and allows clearing it', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const file = new File(['pdf'], 'material.pdf', { type: 'application/pdf' });

    const { rerender } = render(
      <FileInputButton id="file-1" file={null} onSelect={onSelect} label="Selecionar PDF" />,
    );

    await user.upload(screen.getByLabelText('Selecionar PDF'), file);
    expect(onSelect).toHaveBeenCalledWith(file);

    onSelect.mockClear();
    rerender(<FileInputButton id="file-1" file={file} onSelect={onSelect} />);
    expect(screen.getByText('material.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remover arquivo material.pdf' }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
