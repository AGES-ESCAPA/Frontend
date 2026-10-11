import { render, screen } from '@testing-library/react';
import { Table } from './Table';
import type { TableColumn } from './Table';

interface CourseRow {
  id: string;
  title: string;
  price: string;
}

const rows: CourseRow[] = [
  { id: '1', title: 'Web Design Avançado', price: 'R$ 199,00' },
  { id: '2', title: 'JavaScript Moderno', price: 'R$ 249,00' },
];

const columns: TableColumn<CourseRow>[] = [
  { id: 'title', header: 'Categoria', render: (row) => row.title },
  { id: 'price', header: 'Preço', render: (row) => row.price },
];

describe('Table', () => {
  it('should render column headers and each row', () => {
    render(<Table columns={columns} data={rows} getRowId={(row) => row.id} caption="Cursos" />);

    expect(screen.getByRole('columnheader', { name: 'Categoria' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Preço' })).toBeInTheDocument();
    expect(screen.getByText('Web Design Avançado')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Moderno')).toBeInTheDocument();
    expect(screen.getByText('R$ 249,00')).toBeInTheDocument();
  });

  it('should center headers and cells by default', () => {
    render(<Table columns={columns} data={rows} getRowId={(row) => row.id} caption="Cursos" />);

    expect(screen.getByRole('columnheader', { name: 'Categoria' }).className).toMatch(
      /alignCenter/,
    );
    expect(screen.getByRole('cell', { name: 'Web Design Avançado' }).className).toMatch(
      /alignCenter/,
    );
  });

  it('should render the footer outside the data rows', () => {
    render(
      <Table
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        footer="Mostrando 2 de 2 cursos"
      />,
    );

    expect(screen.getByText('Mostrando 2 de 2 cursos')).toBeInTheDocument();
  });

  it('should show the empty message when there are no rows', () => {
    render(
      <Table
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        emptyMessage="Nenhum curso encontrado."
      />,
    );

    expect(screen.getByText('Nenhum curso encontrado.')).toBeInTheDocument();
    expect(screen.queryByText('Web Design Avançado')).not.toBeInTheDocument();
  });
});
