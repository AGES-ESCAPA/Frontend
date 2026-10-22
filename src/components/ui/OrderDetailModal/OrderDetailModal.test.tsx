import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { OrderStatus } from '../OrderFilters';
import { OrderDetailModal } from './OrderDetailModal';
import type { OrderRow } from './OrderDetailModal.constants';

afterEach(cleanup);

const individualOrder: OrderRow = {
  id: '1',
  code: 'PED-00142',
  clientName: 'Ana Paula Ferreira',
  clientEmail: 'ana.ferreira@email.com',
  clientPhone: '(11) 98765-4321',
  clientDocument: '123.456.789-00',
  type: 'INDIVIDUAL',
  courseId: 'curso-design',
  courseName: 'Escape Room Design Avançado',
  seats: 1,
  paymentMethod: 'PIX',
  total: 297,
  createdAt: '2026-08-17',
  status: 'APPROVED',
  statusHistory: [
    {
      status: 'APPROVED',
      date: '2026-08-17T12:00:00.000Z',
      description: 'Pagamento aprovado.',
    },
  ],
};

const corporateCourseOrder: OrderRow = {
  ...individualOrder,
  id: '2',
  code: 'PED-00141',
  clientName: 'Marina Oliveira',
  clientDocument: '12.345.678/0001-90',
  organizationName: 'Escape Corp Ltda.',
  type: 'CORPORATE',
  corporateKind: 'course',
  seats: 5,
  paymentMethod: 'CARD',
  installments: 3,
  total: 1185,
};

const corporateSeatsOrder: OrderRow = {
  ...corporateCourseOrder,
  id: '7',
  code: 'PED-00130',
  corporateKind: 'seats',
  seats: 3,
  paymentMethod: 'BOLETO',
  installments: undefined,
  total: 711,
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  APPROVED: 'Aprovado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const renderModal = (order: OrderRow, onOpenChange: (open: boolean) => void = () => {}) =>
  render(<OrderDetailModal order={order} open onOpenChange={onOpenChange} />);

const getDefinition = (term: string) => screen.getByText(term).nextElementSibling;

describe('OrderDetailModal', () => {
  /*Teste 1*/
  it('mostra os dados completos de um pedido individual', () => {
    renderModal(individualOrder);

    const dialog = screen.getByRole('dialog', { name: 'Detalhe do pedido' });
    const title = within(dialog).getByRole('heading', { name: 'Detalhe do pedido' });
    const code = within(dialog).getByText(individualOrder.code);

    expect(dialog).toBeInTheDocument();
    expect(title.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('PED-00142')).toBeInTheDocument();
    expect(getDefinition('Nome')).toHaveTextContent('Ana Paula Ferreira');
    expect(getDefinition('E-mail')).toHaveTextContent('ana.ferreira@email.com');
    expect(getDefinition('CPF')).toHaveTextContent('123.456.789-00');
    expect(getDefinition('Telefone')).toHaveTextContent('(11) 98765-4321');
    expect(getDefinition('Tipo de conta')).toHaveTextContent('Individual');
    expect(screen.getByText('Escape Room Design Avançado')).toBeInTheDocument();
    expect(screen.getByText('1 acesso individual')).toBeInTheDocument();
    expect(screen.getByText(/^PIX ·/)).toBeInTheDocument();
    expect(screen.getAllByText(/297,00/)).toHaveLength(2);
    expect(screen.queryByText(/colaboradores? com acesso/)).not.toBeInTheDocument();
  });

  /*Teste 2*/
  it('mostra a data do pedido por extenso, em português', () => {
    renderModal(individualOrder);
    expect(screen.getByText(/^PIX · 17 de agosto de 2026$/)).toBeInTheDocument();
  });

  /*Teste 2b*/
  it('não desloca o dia quando a data vem sem hora', () => {
    renderModal({ ...individualOrder, createdAt: '2026-08-21' });
    expect(screen.getByText(/^PIX · 21 de agosto de 2026$/)).toBeInTheDocument();
  });

  /*Teste 3*/
  it('mostra quantos colaboradores têm acesso em pedido corporativo de curso', () => {
    renderModal(corporateCourseOrder);

    expect(getDefinition('CNPJ')).toHaveTextContent('12.345.678/0001-90');
    expect(getDefinition('Tipo de conta')).toHaveTextContent('Corporativo');
    expect(screen.getByText('5 colaboradores com acesso')).toBeInTheDocument();
  });

  /*Teste 3b*/
  it('usa o singular quando só um colaborador tem acesso', () => {
    renderModal({ ...corporateCourseOrder, seats: 1 });
    expect(screen.getByText('1 colaborador com acesso')).toBeInTheDocument();
  });

  /*Teste 4*/
  it('mostra o nome da empresa em pedido corporativo', () => {
    renderModal(corporateCourseOrder);
    expect(getDefinition('Empresa')).toHaveTextContent('Escape Corp Ltda.');
  });

  /*Teste 5*/
  it('mostra as parcelas quando o pagamento é parcelado', () => {
    renderModal(corporateCourseOrder);
    expect(screen.getByText(/Cartão de Crédito em 3x de .*395,00/)).toBeInTheDocument();
  });

  /*Teste 6*/
  it('não mostra colaboradores com acesso em pedido corporativo de assentos', () => {
    renderModal(corporateSeatsOrder);

    expect(getDefinition('Tipo de conta')).toHaveTextContent('Corporativo');
    expect(screen.getByText(/^Boleto ·/)).toBeInTheDocument();
    expect(screen.getByText('3 assentos')).toBeInTheDocument();
    expect(screen.queryByText(/colaboradores? com acesso/)).not.toBeInTheDocument();
    expect(screen.queryByText('1 acesso individual')).not.toBeInTheDocument();
  });

  /*Teste 7*/
  it.each<OrderStatus>(['APPROVED', 'CANCELLED', 'REFUNDED'])(
    'mostra o status atual %s no topo e no histórico',
    (status) => {
      renderModal({
        ...individualOrder,
        status,
        statusHistory: [
          {
            status,
            date: '2026-08-17T12:00:00.000Z',
            description: 'Mudança de status.',
          },
        ],
      });

      expect(screen.getAllByText(STATUS_TEXT[status])).toHaveLength(2);
    },
  );

  /*Teste 7b*/
  it.each<[OrderStatus, string, string]>([
    ['APPROVED', 'info', 'success'],
    ['CANCELLED', 'error', 'error'],
    ['REFUNDED', 'warning', 'warning'],
  ])('a cor dos badges acompanha o status %s', (status, headerTone, historyTone) => {
    renderModal({
      ...individualOrder,
      status,
      statusHistory: [
        {
          status,
          date: '2026-08-17T12:00:00.000Z',
          description: 'Mudança de status.',
        },
      ],
    });

    const [headerBadge, historyBadge] = screen.getAllByText(STATUS_TEXT[status]);

    expect(headerBadge).toHaveAttribute('data-tone', headerTone);
    expect(historyBadge).toHaveAttribute('data-tone', historyTone);
  });

  /*Teste 8*/
  it('mostra o histórico de status em ordem cronológica', () => {
    renderModal({
      ...individualOrder,
      status: 'REFUNDED',
      statusHistory: [
        {
          status: 'REFUNDED',
          date: '2026-08-18T12:00:00.000Z',
          description: 'Reembolso solicitado pelo administrador.',
        },
        {
          status: 'APPROVED',
          date: '2026-08-17T12:00:00.000Z',
          description: 'Pagamento aprovado.',
        },
      ],
    });

    const history = screen
      .getByRole('heading', { name: 'Histórico de status' })
      .closest('section') as HTMLElement;
    const items = within(history).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Pagamento aprovado.');
    expect(items[1]).toHaveTextContent('Reembolso solicitado pelo administrador.');
    expect(items[1]).toHaveTextContent(/18\/08\/2026.*09:00/);
  });

  /*Teste 9*/
  it('sem actions, não há rodapé: só o Fechar do cabeçalho', () => {
    renderModal(individualOrder);

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getAllByRole('button', { name: 'Fechar' })).toHaveLength(1);
    expect(
      within(dialog).queryByRole('button', { name: /reembolsar|cancelar/i }),
    ).not.toBeInTheDocument();
  });

  /*Teste 10*/
  it('chama onOpenChange(false) ao clicar em Fechar no cabeçalho', async () => {
    // Preparar
    const onOpenChange = vi.fn();
    renderModal(individualOrder, onOpenChange);
    const dialog = screen.getByRole('dialog');

    // Agir
    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));

    // Verificar
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /*Teste 10c*/
  it('chama onOpenChange(false) ao pressionar Esc', async () => {
    const onOpenChange = vi.fn();
    renderModal(individualOrder, onOpenChange);

    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /*Teste 11*/
  it('mostra no rodapé o conteúdo recebido em actions', () => {
    render(
      <OrderDetailModal
        order={individualOrder}
        open
        onOpenChange={() => {}}
        actions={<button type="button">Reembolsar pedido</button>}
      />,
    );

    const dialog = screen.getByRole('dialog');
    const action = within(dialog).getByRole('button', { name: 'Reembolsar pedido' });
    const history = screen
      .getByRole('heading', { name: 'Histórico de status' })
      .closest('section') as HTMLElement;

    expect(history.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(history).not.toContainElement(action);
  });
});
