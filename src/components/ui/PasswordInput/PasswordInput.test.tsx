import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('should start with password hidden (type="password") and toggle to visible on button click', async () => {
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Digite sua senha" />);

    const input = screen.getByPlaceholderText('Digite sua senha');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: 'Mostrar senha' });
    expect(toggleButton).toHaveAttribute('type', 'button');
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Ocultar senha');
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Mostrar senha');
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should operate through keyboard and toggle visibility with Space or Enter', async () => {
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Senha de acesso" />);

    const input = screen.getByPlaceholderText('Senha de acesso');
    const toggleButton = screen.getByRole('button', { name: 'Mostrar senha' });

    toggleButton.focus();
    expect(toggleButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(input).toHaveAttribute('type', 'text');

    await user.keyboard(' ');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should not submit an enclosing form when the toggle button is clicked or activated by key', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <PasswordInput placeholder="Senha" />
        <button type="submit">Enviar</button>
      </form>,
    );

    const toggleButton = screen.getByRole('button', { name: 'Mostrar senha' });
    await user.click(toggleButton);

    expect(handleSubmit).not.toHaveBeenCalled();

    toggleButton.focus();
    await user.keyboard('{Enter}');
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should pass down the invalid state matching TextInput behavior', () => {
    const { container, rerender } = render(<PasswordInput placeholder="Senha" invalid />);

    const input = screen.getByPlaceholderText('Senha');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const wrapper = container.querySelector('[data-invalid="true"]');
    expect(wrapper).toBeInTheDocument();

    rerender(<PasswordInput placeholder="Senha" invalid={false} />);
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(container.querySelector('[data-invalid="true"]')).not.toBeInTheDocument();
  });

  it('should default autoComplete to "current-password" and accept custom autoComplete', () => {
    const { rerender } = render(<PasswordInput placeholder="Senha" />);
    expect(screen.getByPlaceholderText('Senha')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );

    rerender(<PasswordInput placeholder="Senha" autoComplete="new-password" />);
    expect(screen.getByPlaceholderText('Senha')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('should forward ref correctly to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} placeholder="Senha com ref" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('Senha com ref');
  });

  it('should allow overriding the default lock icon or passing null', () => {
    const { rerender } = render(
      <PasswordInput placeholder="Senha" icon={<span data-testid="custom-icon">Key</span>} />,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();

    rerender(<PasswordInput placeholder="Senha" icon={null} />);
    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
  });

  it('should prevent default on mouse down of toggle button to prevent focus loss', () => {
    render(<PasswordInput placeholder="Senha" />);

    const toggleButton = screen.getByRole('button', { name: 'Mostrar senha' });
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    toggleButton.dispatchEvent(mouseDownEvent);

    expect(mouseDownEvent.defaultPrevented).toBe(true);
  });
});
