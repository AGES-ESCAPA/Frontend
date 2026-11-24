import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

describe('Toast', () => {
  it('does not render content when closed', () => {
    render(
      <Toast
        open={false}
        onOpenChange={vi.fn()}
        title="Salvo"
        description="Alterações publicadas."
      />,
    );

    expect(screen.queryByText('Salvo')).not.toBeInTheDocument();
  });

  it('renders success variant with title and description', () => {
    render(
      <Toast open onOpenChange={vi.fn()} title="Pagamento confirmado" description="Pedido #42." />,
    );

    expect(screen.getByText('Pagamento confirmado')).toBeInTheDocument();
    expect(screen.getByText('Pedido #42.')).toBeInTheDocument();
  });

  it('runs the action callback and closes from the dismiss control', async () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Toast
        open
        onOpenChange={onOpenChange}
        title="Falha ao salvar"
        variant="error"
        actionLabel="Tentar novamente"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onAction).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
