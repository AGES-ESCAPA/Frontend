import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { TableFilter } from './TableFilter';
import type { TableFilterPeriodValue, TableFilterSelectField } from './TableFilter';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'A', label: 'Opção A' },
  { value: 'B', label: 'Opção B' },
];

describe('TableFilter', () => {
  it('renderiza selects, período e limpar a partir da configuração', () => {
    const selects: TableFilterSelectField[] = [
      {
        id: 'type',
        label: 'Tipo',
        value: '',
        options: TYPE_OPTIONS,
        onChange: vi.fn(),
      },
    ];

    render(
      <TableFilter
        selects={selects}
        period={{
          label: 'Período',
          value: { startDate: '', endDate: '' },
          onChange: vi.fn(),
        }}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Período' })).toHaveTextContent('Todos');
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('notifica onChange do select e permite voltar para Todos', async () => {
    const onChange = vi.fn();
    const selects: TableFilterSelectField[] = [
      {
        id: 'type',
        label: 'Tipo',
        value: 'A',
        options: TYPE_OPTIONS,
        onChange,
      },
    ];

    render(<TableFilter selects={selects} showClearButton={false} />);

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), '');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('valida o período e só propaga datas válidas', () => {
    const onPeriodChange = vi.fn();

    render(
      <TableFilter
        selects={[]}
        period={{
          label: 'Período',
          value: { startDate: '', endDate: '2026-01-10' },
          onChange: onPeriodChange,
        }}
        showClearButton={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-02-01' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/data inicial/i);
    expect(onPeriodChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-05' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onPeriodChange).toHaveBeenCalledWith({
      startDate: '2026-01-05',
      endDate: '2026-01-10',
    });
  });

  it('limpa draft local inválido ao clicar em Limpar filtros', async () => {
    const Controlled = () => {
      const [period, setPeriod] = useState<TableFilterPeriodValue>({
        startDate: '',
        endDate: '2026-01-10',
      });
      return (
        <TableFilter
          selects={[]}
          period={{ label: 'Período', value: period, onChange: setPeriod }}
          onClear={() => setPeriod({ startDate: '', endDate: '' })}
        />
      );
    };

    render(<Controlled />);
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-02-01' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Data inicial')).toHaveValue('');
    expect(screen.getByLabelText('Data final')).toHaveValue('');
  });
});
