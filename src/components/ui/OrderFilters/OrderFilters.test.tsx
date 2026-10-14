import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OrderFilters } from './OrderFilters';
import { EMPTY_FILTERS } from './OrderFilters.constants';
import type { OrderFiltersValue } from './OrderFilters.constants';

const courses = [
  { id: 'Filter1', name: 'Turismo com AI' },
  { id: 'Filter2', name: 'Turismo em POA' },
];

const FILLED: OrderFiltersValue = {
  type: 'individual',
  courseId: 'Filter1',
  startDate: '2026-01-01',
  endDate: '2026-02-01',
  status: 'Approved',
};

function setup(initial: OrderFiltersValue = EMPTY_FILTERS) {
  const onChange = vi.fn();
  render(<OrderFilters value={initial} onChange={onChange} courses={courses} />);
  return { onChange };
}

const optionLabels = (label: string) =>
  Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.text);

describe('OrderFilters', () => {
  describe('renderização', () => {
    it('exibe todos os filtros e o botão "Limpar filtros"', () => {
      setup();
      expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Curso')).toBeInTheDocument();
      expect(screen.getByLabelText('Data inicial')).toBeInTheDocument();
      expect(screen.getByLabelText('Data final')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
    });

    it('oferece Todos, Individual e Corporativo em Tipo', () => {
      setup();
      expect(optionLabels('Tipo')).toEqual(['Todos', 'Individual', 'Corporativo']);
    });

    it('oferece Todos, Aprovado, Cancelado e Reembolsado em Status', () => {
      setup();
      expect(optionLabels('Status')).toEqual(['Todos', 'Aprovado', 'Cancelado', 'Reembolsado']);
    });

    it('lista "Todos" e os cursos recebidos por prop em Curso', () => {
      setup();
      expect(optionLabels('Curso')).toEqual(['Todos', 'Turismo com AI', 'Turismo em POA']);
    });

    it('reflete o value recebido (componente controlado)', () => {
      setup(FILLED);
      expect(screen.getByLabelText('Tipo')).toHaveValue('individual');
      expect(screen.getByLabelText('Status')).toHaveValue('Approved');
      expect(screen.getByLabelText('Curso')).toHaveValue('Filter1');
      expect(screen.getByLabelText('Data inicial')).toHaveValue('2026-01-01');
      expect(screen.getByLabelText('Data final')).toHaveValue('2026-02-01');
    });
  });

  /*Teste 1*/
  describe('cada filtro altera o valor entregue em onChange', () => {
    it('altera o tipo', async () => {
      const { onChange } = setup();
      await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'corporate');
      expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, type: 'corporate' });
    });

    /*Teste 2*/

    it('altera o curso', async () => {
      const { onChange } = setup();
      await userEvent.selectOptions(screen.getByLabelText('Curso'), 'Filter2');
      expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, courseId: 'Filter2' });
    });

    /*Teste 3*/

    it.each(['Approved', 'Cancelled', 'Refunded'] as const)(
      'altera o status para %s',
      async (status) => {
        const { onChange } = setup();
        await userEvent.selectOptions(screen.getByLabelText('Status'), status);
        expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, status });
      },
    );

    /*Teste 4*/

    it('altera a data inicial', () => {
      const { onChange } = setup();
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-10' } });
      expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, startDate: '2026-01-10' });
    });

    it('altera a data final', () => {
      const { onChange } = setup();
      fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-03-10' } });
      expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, endDate: '2026-03-10' });
    });

    /*Teste 5*/

    it('preserva os demais filtros ao alterar um deles', async () => {
      const { onChange } = setup(FILLED);
      await userEvent.selectOptions(screen.getByLabelText('Status'), 'Refunded');
      expect(onChange).toHaveBeenCalledWith({ ...FILLED, status: 'Refunded' });
    });
  });

  /*Teste 6*/

  describe('limpar filtros', () => {
    it('volta tudo para "Todos" e sem período', async () => {
      const { onChange } = setup(FILLED);
      await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
      expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
    });

    /*Teste 7*/

    it('limpa o erro e as datas digitadas mesmo que o período inválido nunca tenha chegado ao onChange', async () => {
      setup({ ...EMPTY_FILTERS, endDate: '2026-01-10' });
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-02-01' } });
      expect(screen.getByRole('alert')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Data inicial')).toHaveValue('');
      expect(screen.getByLabelText('Data final')).toHaveValue('');
    });
  });

  /*Teste 8*/

  describe('período inválido', () => {
    it('exibe erro e não dispara onChange quando a data inicial é posterior à final', () => {
      const { onChange } = setup({ ...EMPTY_FILTERS, endDate: '2026-01-10' });
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-02-01' } });
      expect(screen.getByRole('alert')).toHaveTextContent(/data inicial/i);
      expect(onChange).not.toHaveBeenCalled();
    });

    /*Teste 9*/

    it('exibe erro quando a data final é anterior à inicial', () => {
      const { onChange } = setup({ ...EMPTY_FILTERS, startDate: '2026-02-01' });
      fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-01-10' } });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    /*Teste 10*/

    it('marca os campos de data como inválidos', () => {
      setup({ ...EMPTY_FILTERS, endDate: '2026-01-10' });
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-02-01' } });
      expect(screen.getByLabelText('Data inicial')).toBeInvalid();
      expect(screen.getByLabelText('Data final')).toBeInvalid();
    });

    it('aceita datas iguais (início e fim no mesmo dia)', () => {
      const { onChange } = setup({ ...EMPTY_FILTERS, endDate: '2026-01-10' });
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-10' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    /*Teste 11*/

    it('remove o erro ao corrigir o período', () => {
      const { onChange } = setup({ ...EMPTY_FILTERS, endDate: '2026-01-10' });
      const start = screen.getByLabelText('Data inicial');
      fireEvent.change(start, { target: { value: '2026-02-01' } });
      fireEvent.change(start, { target: { value: '2026-01-05' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('campo Período', () => {
    it('mostra "Todos" quando não há período', () => {
      setup();
      expect(screen.getByRole('button', { name: 'Período' })).toHaveTextContent('Todos');
    });

    it('mostra o intervalo escolhido', () => {
      setup(FILLED);
      expect(screen.getByRole('button', { name: 'Período' })).toHaveTextContent(
        '01/01/26 – 01/02/26',
      );
    });

    it('abre o painel com as datas ao clicar e fecha com Escape', async () => {
      setup();
      const trigger = screen.getByRole('button', { name: 'Período' });
      expect(screen.getByLabelText('Data inicial')).not.toBeVisible();

      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByLabelText('Data inicial')).toBeVisible();
      expect(screen.getByLabelText('Data final')).toBeVisible();

      await userEvent.keyboard('{Escape}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByLabelText('Data inicial')).not.toBeVisible();
    });

    it('fecha o painel ao clicar fora', async () => {
      setup();
      await userEvent.click(screen.getByRole('button', { name: 'Período' }));
      await userEvent.click(document.body);
      expect(screen.getByLabelText('Data inicial')).not.toBeVisible();
    });
  });
});
