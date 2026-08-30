import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Mail } from 'lucide-react';
import { Button } from './Button';
import type { ButtonVariant } from './Button';

describe('Button component', () => {
  // ── Rendering ────────────────────────────────────────────────────
  it('should render with the provided label', () => {
    render(<Button label="Começar Agora" variant="primary" />);

    expect(screen.getByRole('button', { name: /começar agora/i })).toBeInTheDocument();
    expect(screen.getByText('Começar Agora')).toBeInTheDocument();
  });

  it('should render an icon to the left of the label when provided', () => {
    render(
      <Button label="Gestão de Cursos" variant="outlined" icon={<Mail data-testid="icon" />} />,
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Cursos')).toBeInTheDocument();
  });

  it('should render without an icon when icon prop is omitted', () => {
    render(<Button label="Começar Agora" variant="primary" />);

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByText('Começar Agora')).toBeInTheDocument();
  });

  // ── Click Events ─────────────────────────────────────────────────
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button label="Submit" variant="primary" onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  // ── Disabled State ───────────────────────────────────────────────
  it('should be disabled and not respond to clicks when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button label="Submit" variant="primary" disabled onClick={handleClick} />);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ── Loading State ────────────────────────────────────────────────
  it('should show a spinner and hide label/icon when loading', () => {
    render(
      <Button label="Submit" variant="secondary" isLoading icon={<Mail data-testid="icon" />} />,
    );

    const button = screen.getByRole('button', { name: /submit/i });

    // Button should be disabled and have aria-busy
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    // Label and icon should not be visible
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();

    // Spinner SVG should be present
    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('should not call onClick when loading', async () => {
    const handleClick = vi.fn();
    render(<Button label="Submit" variant="primary" isLoading onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ── fullWidth ────────────────────────────────────────────────────
  it('should apply fullWidth class when fullWidth is true', () => {
    render(<Button label="Full Width" variant="primary" fullWidth />);

    const button = screen.getByRole('button', { name: /full width/i });
    expect(button.className).toMatch(/fullWidth/);
  });

  it('should not apply fullWidth class when fullWidth is false or omitted', () => {
    render(<Button label="Auto Width" variant="primary" />);

    const button = screen.getByRole('button', { name: /auto width/i });
    expect(button.className).not.toMatch(/fullWidth/);
  });

  // ── asChild (Radix Slot) ─────────────────────────────────────────
  it('should render as a child element via Radix Slot when asChild is true', () => {
    render(
      <Button label="Login" variant="primary" asChild>
        <a href="/login" />
      </Button>,
    );

    const link = screen.getByRole('link', { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');

    // Should NOT render a <button> element
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ── Variants ─────────────────────────────────────────────────────
  const variants: ButtonVariant[] = ['primary', 'secondary', 'outlined', 'ghost', 'active'];

  variants.forEach((variant) => {
    it(`should apply the correct CSS class for variant "${variant}"`, () => {
      render(<Button label={`${variant} button`} variant={variant} />);

      const button = screen.getByRole('button', { name: new RegExp(`${variant} button`, 'i') });
      expect(button.className).toMatch(new RegExp(`variant-${variant}`));
    });
  });

  // ── Accessibility ────────────────────────────────────────────────
  it('should set aria-label to the label prop', () => {
    render(<Button label="Acessar plataforma" variant="primary" />);

    expect(screen.getByRole('button', { name: /acessar plataforma/i })).toBeInTheDocument();
  });
});
