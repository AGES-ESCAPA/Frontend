import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('should not render the dialog when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Excluir curso?"
        description="Esta ação não pode ser desfeita."
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render title, description and destructive confirm action when open', () => {
    render(
      <ConfirmDialog
        open
        title="Excluir curso?"
        description="Ingles para Recepcao sairá do catálogo ativo."
        confirmLabel="Excluir curso"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir curso?' })).toBeInTheDocument();
    expect(screen.getByText('Ingles para Recepcao sairá do catálogo ativo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir curso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('should call onConfirm when the confirm button is pressed', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open
        title="Excluir curso?"
        description="Confirme para continuar."
        confirmLabel="Excluir curso"
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Excluir curso' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should close without confirming when cancel is pressed', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open
        title="Excluir curso?"
        description="Confirme para continuar."
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should block dismiss while confirming', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open
        title="Excluir curso?"
        description="Confirme para continuar."
        isConfirming
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );

    await user.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
