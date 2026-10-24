import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OrderRow } from '@components/ui/OrderDetailModal/OrderDetailModal.constants';
import { OrderCancellationAndRefund } from './OrderCancellationAndRefund';

afterEach(cleanup);

const makeOrder = (status: OrderRow['status']): OrderRow => ({
  id: '1',
  code: 'PED-00142',
  clientName: 'Ana Paula Ferreira',
  clientEmail: 'ana.ferreira@email.com',
  clientPhone: '',
  clientDocument: '',
  type: 'INDIVIDUAL',
  courseId: 'curso-design',
  courseName: 'Escape Room Design Avançado',
  seats: 1,
  paymentMethod: 'PIX',
  total: 297,
  createdAt: '2026-08-17T12:00:00.000Z',
  status,
  statusHistory: [],
});

describe('OrderCancellationAndRefund', () => {
  it('shows cancellation for approved orders and asks for confirmation', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn().mockResolvedValue(undefined);

    render(<OrderCancellationAndRefund order={makeOrder('APPROVED')} onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar pedido' }));

    const dialog = screen.getByRole('dialog', { name: 'Confirmar cancelamento' });
    expect(dialog).toHaveTextContent('O progresso concluído pelo aluno será preservado.');
    expect(onAction).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(onAction).toHaveBeenCalledWith('cancel');
  });

  it('shows refund only for cancelled orders', () => {
    render(<OrderCancellationAndRefund order={makeOrder('CANCELLED')} onAction={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Reembolsar pedido' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
  });

  it('shows no action for refunded orders', () => {
    render(<OrderCancellationAndRefund order={makeOrder('REFUNDED')} onAction={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /pedido/ })).not.toBeInTheDocument();
  });
});
