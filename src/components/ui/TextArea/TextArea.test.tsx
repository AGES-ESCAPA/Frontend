import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders a textarea and accepts typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TextArea aria-label="Descrição" onChange={onChange} />);

    const field = screen.getByRole('textbox', { name: 'Descrição' });
    await user.type(field, 'Texto longo');
    expect(onChange).toHaveBeenCalled();
  });

  it('marks the field as invalid for assistive technologies', () => {
    render(<TextArea aria-label="Bio" invalid defaultValue="Curta" />);

    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveAttribute('data-invalid', 'true');
  });
});
