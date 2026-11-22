import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Table } from './Table';
import type { TableColumn } from './Table';

const stubMatchMedia = (mobile: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('47.999rem') ? mobile : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

interface CourseRow {
  id: string;
  title: string;
  price: string;
  instructor: string;
  status: string;
  version: string;
}

const rows: CourseRow[] = [
  {
    id: '1',
    title: 'Web Design Avançado',
    price: 'R$ 199,00',
    instructor: 'Ana',
    status: 'Publicado',
    version: 'v1',
  },
  {
    id: '2',
    title: 'JavaScript Moderno',
    price: 'R$ 249,00',
    instructor: 'Bruno',
    status: 'Rascunho',
    version: 'v2',
  },
];

const columns: TableColumn<CourseRow>[] = [
  { id: 'title', header: 'Curso', render: (row) => row.title },
  { id: 'price', header: 'Preço', render: (row) => row.price },
];

const wideColumns: TableColumn<CourseRow>[] = [
  { id: 'title', header: 'Curso', render: (row) => row.title },
  { id: 'instructor', header: 'Instrutor', render: (row) => row.instructor },
  { id: 'price', header: 'Preço', render: (row) => row.price },
  { id: 'status', header: 'Status', render: (row) => row.status },
  { id: 'version', header: 'Versão', render: (row) => row.version },
  {
    id: 'actions',
    header: 'Ações',
    render: (row) => <button type="button">Editar {row.title}</button>,
  },
];

describe('Table', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render column headers and each row', () => {
    render(<Table columns={columns} data={rows} getRowId={(row) => row.id} caption="Cursos" />);

    expect(screen.getByRole('columnheader', { name: 'Curso' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Preço' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Web Design Avançado' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'JavaScript Moderno' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'R$ 249,00' })).toBeInTheDocument();
  });

  it('should center headers and cells by default', () => {
    render(<Table columns={columns} data={rows} getRowId={(row) => row.id} caption="Cursos" />);

    expect(screen.getByRole('columnheader', { name: 'Curso' }).className).toMatch(/alignCenter/);
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

    expect(screen.getByRole('cell', { name: 'Nenhum curso encontrado.' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Web Design Avançado' })).not.toBeInTheDocument();
  });

  it('should mark actions columns and keep non-essential fields behind more details', async () => {
    render(<Table columns={wideColumns} data={rows} getRowId={(row) => row.id} caption="Cursos" />);

    expect(screen.getByRole('columnheader', { name: 'Ações' })).toHaveAttribute(
      'data-role',
      'actions',
    );
    expect(screen.getByRole('columnheader', { name: 'Curso' })).toHaveAttribute(
      'data-role',
      'primary',
    );
    expect(screen.getByRole('columnheader', { name: 'Versão' })).toHaveAttribute(
      'data-essential',
      'false',
    );
    expect(screen.getByRole('columnheader', { name: 'Detalhes' })).toBeInTheDocument();

    const firstMore = screen.getAllByRole('button', { name: 'Mais detalhes' })[0];
    await userEvent.click(firstMore);

    expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('columnheader', { name: 'Versão' })).toHaveAttribute(
      'data-essential',
      'false',
    );
  });

  it('should render a mobile card list with the primary title and actions', () => {
    stubMatchMedia(true);
    render(<Table columns={wideColumns} data={rows} getRowId={(row) => row.id} caption="Cursos" />);

    const cards = screen.getByRole('list', { name: 'Cursos' });
    expect(within(cards).getByText('Web Design Avançado')).toBeInTheDocument();
    expect(
      within(cards).getByRole('button', { name: 'Editar Web Design Avançado' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
