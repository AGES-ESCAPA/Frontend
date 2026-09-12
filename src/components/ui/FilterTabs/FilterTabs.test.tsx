import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FilterTabs, { type FilterTabsProps } from './FilterTabs';

const OPTIONS = ['Todos', 'Inteligência Artificial', 'Marketing'];

function ControlledFilterTabs(props: Partial<FilterTabsProps>) {
  const [selected, setSelected] = useState(props.selected ?? OPTIONS[0]);
  return (
    <FilterTabs
      options={props.options ?? OPTIONS}
      selected={selected}
      onChange={(value) => {
        setSelected(value);
        props.onChange?.(value);
      }}
      groupLabel={props.groupLabel}
    />
  );
}

describe('FilterTabs', () => {
  it('renderiza uma opção para cada item de options', () => {
    render(<ControlledFilterTabs />);

    OPTIONS.forEach((option) => {
      expect(screen.getByRole('tab', { name: option })).toBeInTheDocument();
    });
  });

  it('marca a opção informada em `selected` como ativa', () => {
    render(<ControlledFilterTabs selected="Marketing" />);

    expect(screen.getByRole('tab', { name: 'Marketing' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('data-state', 'inactive');
  });

  it('chama onChange com o valor clicado', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledFilterTabs onChange={handleChange} />);

    await user.click(screen.getByRole('tab', { name: 'Marketing' }));

    expect(handleChange).toHaveBeenCalledWith('Marketing');
  });

  it('permite apenas uma opção ativa por vez (seleção única)', async () => {
    const user = userEvent.setup();
    render(<ControlledFilterTabs />);

    await user.click(screen.getByRole('tab', { name: 'Inteligência Artificial' }));

    expect(screen.getByRole('tab', { name: 'Inteligência Artificial' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByRole('tab', { name: 'Marketing' })).toHaveAttribute(
      'data-state',
      'inactive',
    );
  });

  it('usa groupLabel como aria-label do grupo, sem exibi-lo visualmente', () => {
    render(<ControlledFilterTabs groupLabel="Categoria" />);

    expect(screen.getByRole('tablist', { name: 'Categoria' })).toBeInTheDocument();
    expect(screen.queryByText('Categoria')).not.toBeInTheDocument();
  });

  it('mantém instâncias independentes quando renderizadas lado a lado', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ControlledFilterTabs groupLabel="Categoria" />
        <ControlledFilterTabs options={['Todos', 'Iniciante', 'Avançado']} groupLabel="Nível" />
      </>,
    );

    await user.click(screen.getByRole('tab', { name: 'Marketing' }));

    expect(screen.getByRole('tab', { name: 'Marketing' })).toHaveAttribute('data-state', 'active');
    expect(
      screen.getByRole('tablist', { name: 'Nível' }).querySelector('[data-state="active"]'),
    ).toHaveTextContent('Todos');
  });
});
