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

  it('should render an unordered list when not ranked and an ordered list when ranked', () => {
    const { container, rerender } = render(<BarList items={items} />);

    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelector('ol')).not.toBeInTheDocument();

    rerender(<BarList items={items} ranked />);

    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });

  it('should not add an "undefined" class to the list when ranked', () => {
    render(<BarList items={items} ranked className="extra" />);

    expect(screen.getByRole('list').className).not.toMatch(/undefined/);
    expect(screen.getByRole('list').className).toMatch(/extra/);
  });

  it('should announce the displayed value instead of the share of the ceiling', () => {
    render(<BarList items={items} />);

    expect(screen.getByRole('progressbar', { name: 'Vendas' })).toHaveAttribute(
      'aria-valuetext',
      '92%',
    );
    expect(screen.getByRole('progressbar', { name: 'Cozinha' })).toHaveAttribute(
      'aria-valuetext',
      '23',
    );
  });

  it('should format the fallback value in pt-BR with up to two decimals', () => {
    render(
      <BarList
        items={[
          { id: 'a', label: 'Governança', value: 1234.5678 },
          { id: 'b', label: 'Recepção', value: 2 / 3 },
        ]}
      />,
    );

    expect(screen.getByText('1.234,57')).toBeInTheDocument();
    expect(screen.getByText('0,67')).toBeInTheDocument();
  });

  it('should keep valid bars sized when one value is NaN', () => {
    render(
      <BarList
        items={[
          { id: 'vendas', label: 'Vendas', value: 10 },
          { id: 'recepcao', label: 'Recepção', value: NaN },
          { id: 'cozinha', label: 'Cozinha', value: 5 },
        ]}
      />,
    );

    expect(screen.getByRole('progressbar', { name: 'Vendas' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('progressbar', { name: 'Cozinha' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByRole('progressbar', { name: 'Recepção' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });

  it('should render empty bars when every value is zero', () => {
    render(
      <BarList
        items={[
          { id: 'a', label: 'Vendas', value: 0 },
          { id: 'b', label: 'Cozinha', value: 0 },
        ]}
      />,
    );

    for (const bar of screen.getAllByRole('progressbar')) {
      expect(bar).toHaveAttribute('aria-valuenow', '0');
    }
  });

  it('should render empty bars when max is zero', () => {
    render(<BarList items={items} max={0} />);

    for (const bar of screen.getAllByRole('progressbar')) {
      expect(bar).toHaveAttribute('aria-valuenow', '0');
    }
  });

  it('should treat negative values as an empty bar', () => {
    render(
      <BarList
        items={[
          { id: 'a', label: 'Vendas', value: 10 },
          { id: 'b', label: 'Cozinha', value: -4 },
        ]}
      />,
    );

    expect(screen.getByRole('progressbar', { name: 'Cozinha' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('should fill the bar when a value is above max', () => {
    render(<BarList items={items} max={50} />);

    const bar = screen.getByRole('progressbar', { name: 'Vendas' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.firstElementChild).toHaveStyle({ width: '100%' });
  });

  it('should size the bar width to the value share of max', () => {
    render(<BarList items={items} max={100} />);

    expect(screen.getByRole('progressbar', { name: 'Recepção' }).firstElementChild).toHaveStyle({
      width: '46%',
    });
  });

  it('should expose the full label as a title for truncated names', () => {
    const label = 'Rede Hoteleira Costa Verde Resorts & Convenções Ltda.';
    render(<BarList items={[{ id: 'costa', label, value: 259 }]} ranked />);

    expect(screen.getByText(label)).toHaveAttribute('title', label);
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
