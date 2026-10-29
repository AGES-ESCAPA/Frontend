import { render, screen, within } from '@testing-library/react';
import { BarList } from './BarList';
import type { BarListItem } from './BarList';

const items: BarListItem[] = [
  { id: 'vendas', label: 'Vendas', value: 92, displayValue: '92%' },
  { id: 'recepcao', label: 'Recepção', value: 46, displayValue: '46%' },
  { id: 'cozinha', label: 'Cozinha', value: 23 },
];

describe('BarList', () => {
  it('should render the label and the displayed value of each item', () => {
    render(<BarList items={items} />);

    expect(screen.getByText('Vendas')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('Recepção')).toBeInTheDocument();
    expect(screen.getByText('46%')).toBeInTheDocument();
  });

  it('should fall back to the raw value when displayValue is not given', () => {
    render(<BarList items={items} />);

    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('should size bars proportionally to the largest value by default', () => {
    render(<BarList items={items} />);

    expect(screen.getByRole('progressbar', { name: 'Vendas' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('progressbar', { name: 'Recepção' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByRole('progressbar', { name: 'Cozinha' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    );
  });

  it('should size bars against the given max', () => {
    render(<BarList items={items} max={184} />);

    expect(screen.getByRole('progressbar', { name: 'Vendas' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByRole('progressbar', { name: 'Recepção' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    );
  });

  it('should show the position of each item when ranked', () => {
    render(<BarList items={items} ranked />);

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('1')).toBeInTheDocument();
    expect(within(rows[1]).getByText('2')).toBeInTheDocument();
    expect(within(rows[2]).getByText('3')).toBeInTheDocument();
  });

  it('should not show positions when not ranked', () => {
    render(<BarList items={items} />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('should show a message when there are no items', () => {
    render(<BarList items={[]} />);

    expect(screen.getByText('Nenhum dado disponível.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('should accept a custom empty message', () => {
    render(<BarList items={[]} emptyMessage="Nenhuma empresa encontrada." />);

    expect(screen.getByText('Nenhuma empresa encontrada.')).toBeInTheDocument();
  });
});
