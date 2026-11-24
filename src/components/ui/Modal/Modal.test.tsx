import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} title="Fechar curso">
        Conteúdo
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, body, footer and closes from the dismiss control', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Nova aula"
        subtitle="Módulo 1"
        footer={<button type="button">Confirmar</button>}
      >
        <p>Campos do formulário</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Nova aula' })).toBeInTheDocument();
    expect(screen.getByText('Módulo 1')).toBeInTheDocument();
    expect(screen.getByText('Campos do formulário')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits through the wrapped form when onSubmit is provided', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    const user = userEvent.setup();

    render(
      <Modal
        open
        onOpenChange={vi.fn()}
        title="Editar"
        onSubmit={onSubmit}
        footer={<button type="submit">Salvar</button>}
      >
        <input aria-label="Título" defaultValue="Aula" />
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
