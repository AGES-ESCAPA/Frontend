import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import type { OrderRow } from '@components/ui';
import {
  OrderActionError,
  type OrderManagementService,
} from '@services/orderCancellationMockService';
import { Ordermanagement } from './OrderManagement';

afterEach(cleanup);

const getOrderRows = () => screen.getAllByRole('row').slice(1);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/pedidos']}>
      <Ordermanagement />
    </MemoryRouter>,
  );

describe('Ordermanagement', () => {
  /*Teste 1 */
  it('exibe o resumo e a listagem de pedidos', () => {
    renderPage();

    expect(screen.getByText('Pedidos', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByLabelText('7 pedidos')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Receita aprovada' })).toHaveTextContent(
      /4\.460,00/,
    );

    expect(screen.getByText('Liberação de acesso automática via checkout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
    expect(screen.getByText('Mostrando 7 de 7 pedidos')).toBeInTheDocument();
  });

  /*Teste 2 */

  it('filtra por tipo de pedido', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Tipo'), 'CORPORATE');

    expect(getOrderRows()).toHaveLength(3);
  });

  /*Teste 3 */

  it('filtra por status', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Status'), 'CANCELLED');

    expect(getOrderRows()).toHaveLength(1);
    expect(getOrderRows()[0]).toHaveTextContent('Roberto Alves');
  });

  /*Teste 4*/

  it('filtra por curso', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Curso'), 'curso-design');

    expect(getOrderRows()).toHaveLength(2);
  });

  /*Teste 5*/

  it('filtra por período', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Período' }));
    fireEvent.change(screen.getByLabelText('Data inicial'), {
      target: { value: '2026-08-15' },
    });

    expect(getOrderRows()).toHaveLength(2);
  });

  /*Teste 6*/

  it('combina filtros de tipo e curso', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Tipo'), 'CORPORATE');
    await user.selectOptions(screen.getByLabelText('Curso'), 'curso-excel');

    expect(getOrderRows()).toHaveLength(1);
    expect(getOrderRows()[0]).toHaveTextContent('Marina Oliveira');
  });

  /*Teste 7 */

  it('limpa todos os filtros e restaura a contagem de pedidos', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Tipo'), 'CORPORATE');
    expect(screen.getByText('Mostrando 3 de 7 pedidos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(getOrderRows()).toHaveLength(7);
    expect(screen.getByText('Mostrando 7 de 7 pedidos')).toBeInTheDocument();
  });

  /*Teste 7 */

  it('busca pedidos pelo nome do solicitante', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Buscar pedido' }), 'Marina');

    expect(getOrderRows()).toHaveLength(1);
    expect(getOrderRows()[0]).toHaveTextContent('Marina Oliveira');
  });

  /*Teste 8 */

  it('exibe os detalhes do pedido corporativo, com assentos e histórico', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00141' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('marina.oliveira@email.com');
    expect(within(dialog).getByText('5 colaboradores com acesso')).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Pagamento aprovado.');
  });

  /*Teste 8 */

  it('exibe o histórico completo de um pedido reembolsado', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00135' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Pagamento aprovado.');
    expect(dialog).toHaveTextContent('Reembolso solicitado pelo administrador.');
  });

  /*Teste 9 */

  it('mantém os ícones de ação na tabela e deixa os comandos disponíveis no detalhe', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getAllByRole('button', { name: /Ver pedido/ })).toHaveLength(7);
    expect(screen.getAllByRole('button', { name: /Cancelar pedido/ })).toHaveLength(7);
    expect(screen.getAllByRole('button', { name: /Reembolsar pedido/ })).toHaveLength(7);
    screen
      .getAllByRole('button', { name: /Cancelar pedido|Reembolsar pedido/ })
      .forEach((button) => expect(button).toBeDisabled());

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00142' }));
    const approvedDetails = screen.getByRole('dialog', { name: 'PED-00142' });
    expect(within(approvedDetails).getByRole('button', { name: 'Cancelar pedido' })).toBeEnabled();
    expect(
      within(approvedDetails).queryByRole('button', { name: 'Reembolsar pedido' }),
    ).not.toBeInTheDocument();

    await user.click(within(approvedDetails).getByRole('button', { name: 'Fechar' }));
    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00139' }));
    const cancelledDetails = screen.getByRole('dialog', { name: 'PED-00139' });
    expect(
      within(cancelledDetails).getByRole('button', { name: 'Reembolsar pedido' }),
    ).toBeEnabled();
    expect(
      within(cancelledDetails).queryByRole('button', { name: 'Cancelar pedido' }),
    ).not.toBeInTheDocument();

    await user.click(within(cancelledDetails).getByRole('button', { name: 'Fechar' }));
    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00135' }));
    const refundedDetails = screen.getByRole('dialog', { name: 'PED-00135' });
    expect(
      within(refundedDetails).queryByRole('button', { name: 'Cancelar pedido' }),
    ).not.toBeInTheDocument();
    expect(
      within(refundedDetails).queryByRole('button', { name: 'Reembolsar pedido' }),
    ).not.toBeInTheDocument();
  });

  it('informa quando um pedido de assentos tem colaboradores usando o acesso', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00130' }));
    const details = screen.getByRole('dialog', { name: 'PED-00130' });
    await user.click(within(details).getByRole('button', { name: 'Cancelar pedido' }));
    const confirmation = screen.getByRole('dialog', { name: 'Confirmar cancelamento' });
    await user.click(within(confirmation).getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(screen.getByText('Não foi possível concluir a ação')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Não é possível cancelar este pedido: 2 de 3 assentos estão em uso. Libere os assentos antes de tentar novamente.',
      ),
    ).toBeInTheDocument();

    await user.click(within(confirmation).getByRole('button', { name: 'Cancelar' }));
    await user.click(within(details).getByRole('button', { name: 'Fechar' }));
    expect(screen.getByRole('row', { name: /PED-00130/ })).toHaveTextContent('Aprovado');
    expect(
      within(screen.getByRole('row', { name: /PED-00130/ })).getByRole('button', {
        name: 'Cancelar pedido PED-00130',
      }),
    ).toBeDisabled();
  });

  it('atualiza o detalhe e informa quando o pedido mudou desde a abertura', async () => {
    const user = userEvent.setup();
    const approvedOrder: OrderRow = {
      id: 'conflict-1',
      code: 'PED-CONFLITO',
      clientName: 'Ana Paula Ferreira',
      clientEmail: 'ana.ferreira@email.com',
      clientPhone: '',
      clientDocument: '',
      type: 'INDIVIDUAL',
      courseId: 'curso-design',
      courseName: 'Escape Room Design Avançado',
      seats: 1,
      paymentMethod: 'Pix',
      total: 297,
      createdAt: '2026-08-17T12:00:00.000Z',
      status: 'APPROVED',
      statusHistory: [
        {
          status: 'APPROVED',
          date: '2026-08-17T12:00:00.000Z',
          description: 'Pagamento aprovado.',
        },
      ],
    };
    let currentOrder = approvedOrder;
    const orderService: OrderManagementService = {
      listOrders: () => [currentOrder],
      executeAction: () => {
        currentOrder = {
          ...approvedOrder,
          status: 'CANCELLED',
          statusHistory: [
            ...approvedOrder.statusHistory,
            {
              status: 'CANCELLED',
              date: '2026-08-18T12:00:00.000Z',
              description: 'Pedido cancelado por outro administrador.',
            },
          ],
        };
        throw new OrderActionError(
          409,
          'O pedido foi atualizado por outra ação. Confira o status antes de tentar novamente.',
        );
      },
    };

    render(
      <MemoryRouter initialEntries={['/admin/pedidos']}>
        <Ordermanagement orderService={orderService} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-CONFLITO' }));
    const details = screen.getByRole('dialog', { name: 'PED-CONFLITO' });
    await user.click(within(details).getByRole('button', { name: 'Cancelar pedido' }));
    const confirmation = screen.getByRole('dialog', { name: 'Confirmar cancelamento' });
    await user.click(within(confirmation).getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(await screen.findByText('Não foi possível concluir a ação')).toBeInTheDocument();
    expect(
      screen.getByText(
        'O pedido foi atualizado por outra ação. Confira o status antes de tentar novamente.',
      ),
    ).toBeInTheDocument();
    expect(within(details).getAllByText('Cancelado')).toHaveLength(2);
    expect(await within(details).findByRole('button', { name: 'Reembolsar pedido' })).toBeEnabled();
    expect(
      within(details).queryByRole('button', { name: 'Cancelar pedido' }),
    ).not.toBeInTheDocument();
  });

  /*Teste 10*/

  it('mantém a opção "Todos" do tipo como placeholder desabilitado', () => {
    renderPage();

    const option = within(screen.getByLabelText('Tipo')).getByRole('option', { name: 'Todos' });

    expect(option).toBeDisabled();
  });

  /*Teste 10b*/

  it('abre o modal do pedido clicado e o fecha ao clicar em Fechar', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00139' }));
    const dialog = screen.getByRole('dialog', { name: 'PED-00139' });
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancela um pedido, preserva o progresso e permite registrar o reembolso depois', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver pedido PED-00142' }));
    let details = screen.getByRole('dialog', { name: 'PED-00142' });
    expect(within(details).getByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument();

    await user.click(within(details).getByRole('button', { name: 'Cancelar pedido' }));
    const cancelDialog = screen.getByRole('dialog', { name: 'Confirmar cancelamento' });
    await user.click(within(cancelDialog).getByRole('button', { name: 'Confirmar cancelamento' }));

    details = screen.getByRole('dialog', { name: 'PED-00142' });
    expect(details).toHaveTextContent('Cancelado');
    expect(within(details).getByText(/Acesso revogado; progresso preservado/)).toBeInTheDocument();
    expect(screen.getByText(/Progresso do aluno preservado em 42%/)).toBeInTheDocument();
    await user.click(within(details).getByRole('button', { name: 'Fechar' }));
    const cancelledRow = screen.getByRole('row', { name: /PED-00142/ });
    expect(cancelledRow).toHaveTextContent('Cancelado');
    expect(
      within(cancelledRow).getByRole('button', {
        name: 'Reembolsar pedido PED-00142',
      }),
    ).toBeDisabled();

    await user.click(within(cancelledRow).getByRole('button', { name: 'Ver pedido PED-00142' }));
    details = screen.getByRole('dialog', { name: 'PED-00142' });
    await user.click(within(details).getByRole('button', { name: 'Reembolsar pedido' }));
    const refundDialog = screen.getByRole('dialog', { name: 'Confirmar reembolso' });
    await user.click(within(refundDialog).getByRole('button', { name: 'Confirmar reembolso' }));

    details = screen.getByRole('dialog', { name: 'PED-00142' });
    expect(details).toHaveTextContent('Reembolsado');
    expect(
      within(details).queryByRole('button', { name: 'Reembolsar pedido' }),
    ).not.toBeInTheDocument();
    await user.click(within(details).getByRole('button', { name: 'Fechar' }));
    const refundedRow = screen.getByRole('row', { name: /PED-00142/ });
    expect(refundedRow).toHaveTextContent('Reembolsado');
    within(refundedRow)
      .getAllByRole('button', { name: /Cancelar pedido|Reembolsar pedido/ })
      .forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByText('Reembolso registrado')).toBeInTheDocument();
  });

  /*Teste 11 */

  it('mostra zero pedidos quando a busca não encontra ninguém', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Buscar pedido' }), 'zzzzzz');

    expect(screen.getByText('Mostrando 0 de 7 pedidos')).toBeInTheDocument();
  });
});
