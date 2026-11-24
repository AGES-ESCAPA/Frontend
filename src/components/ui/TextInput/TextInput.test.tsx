import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders addon, icon and right action around the input', () => {
    render(
      <TextInput
        aria-label="Preço"
        addon="R$"
        icon={<Mail data-testid="mail-icon" />}
        rightAction={<button type="button">Ver</button>}
      />,
    );

    expect(screen.getByText('R$')).toBeInTheDocument();
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Preço' })).toBeInTheDocument();
  });

  it('updates the value when typing', async () => {
    const user = userEvent.setup();

    render(<TextInput aria-label="Nome" defaultValue="" />);

    const input = screen.getByRole('textbox', { name: 'Nome' });
    await user.type(input, 'Maria');
    expect(input).toHaveValue('Maria');
  });

  it('exposes invalid state to assistive technologies', () => {
    render(<TextInput aria-label="E-mail" invalid />);

    const input = screen.getByRole('textbox', { name: 'E-mail' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.parentElement).toHaveAttribute('data-invalid', 'true');
  });
});
