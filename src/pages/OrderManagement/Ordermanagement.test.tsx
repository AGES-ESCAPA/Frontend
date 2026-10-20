import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Ordermanagement } from './Ordermanagement';

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

  it('exibe os ícones de ação em cada pedido, mantendo cancelamento e reembolso indisponíveis', () => {
    renderPage();

    expect(screen.getAllByRole('button', { name: /Ver pedido/ })).toHaveLength(7);
    expect(screen.getAllByRole('button', { name: /Cancelar pedido/ })).toHaveLength(7);
    expect(screen.getAllByRole('button', { name: /Reembolsar pedido/ })).toHaveLength(7);
    screen
      .getAllByRole('button', { name: /Cancelar pedido/ })
      .forEach((button) => expect(button).toBeDisabled());
    screen
      .getAllByRole('button', { name: /Reembolsar pedido/ })
      .forEach((button) => expect(button).toBeDisabled());
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

  /*Teste 11 */

  it('mostra zero pedidos quando a busca não encontra ninguém', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Buscar pedido' }), 'zzzzzz');

    expect(screen.getByText('Mostrando 0 de 7 pedidos')).toBeInTheDocument();
  });
});
