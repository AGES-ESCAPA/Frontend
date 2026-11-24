import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('reflects the checked state and toggles on click', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Amostra grátis" />,
    );

    const toggle = screen.getByRole('switch', { name: 'Amostra grátis' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Switch checked onCheckedChange={onCheckedChange} disabled aria-label="Bloqueado" />);

    const toggle = screen.getByRole('switch', { name: 'Bloqueado' });
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
