import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders the label and associates it with the input', () => {
    render(<Checkbox label="Aceito os termos" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Aceito os termos' });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('shows an optional hint below the label', () => {
    render(<Checkbox label="Newsletter" hint="Enviamos no máximo um e-mail por mês." />);

    expect(screen.getByText('Enviamos no máximo um e-mail por mês.')).toBeInTheDocument();
  });

  it('calls onChange when toggled', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox label="Lembrar de mim" onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Lembrar de mim' }));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('respects the disabled state', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox label="Indisponível" disabled onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Indisponível' });
    expect(checkbox).toBeDisabled();
    await user.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });
});
