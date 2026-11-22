import { render, screen, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';
import { useAdminCourses } from '@hooks/useAdminCourses';
import type { AdminCourseRow } from '@/types/course';
import { AdminCourses } from './AdminCourses';

vi.mock('@hooks/useAdminCourses', () => ({
  useAdminCourses: vi.fn(),
}));

const useAdminCoursesMock = vi.mocked(useAdminCourses);

const COURSES: AdminCourseRow[] = [
  {
    id: 'e0000000-0000-4000-e000-000000000001',
    code: 'AE',
    title: 'Atendimento de Excelencia em Hospedagem',
    category: 'Hospitalidade',
    price: 249.9,
    status: 'PUBLISHED',
    version: 'v1.2',
  },
  {
    id: 'e0000000-0000-4000-e000-000000000002',
    code: 'GR',
    title: 'Gestao de Reservas e Overbooking',
    category: 'Gestão',
    price: 329.9,
    status: 'PUBLISHED',
    version: 'v2.0',
  },
  {
    id: 'e0000000-0000-4000-e000-000000000003',
    code: 'IR',
    title: 'Ingles para Recepcao',
    category: 'Idiomas',
    price: 189.9,
    status: 'DRAFT',
    version: 'v0.1',
  },
];

const renderPage = (): RenderResult =>
  render(
    <MemoryRouter initialEntries={['/admin/cursos']}>
      <Routes>
        <Route path="/admin/cursos" element={<AdminCourses />} />
        <Route path="/admin/cursos/novo" element={<p>Novo curso</p>} />
        <Route path="/admin/cursos/:id/editar" element={<p>Editar curso</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('AdminCourses', () => {
  beforeEach(() => {
    useAdminCoursesMock.mockReturnValue({
      courses: COURSES,
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse: vi.fn().mockResolvedValue(undefined),
      unarchiveCourse: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('should integrate the admin Sidebar with Course Management as the current section', () => {
    renderPage();

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — admin/i });
    const currentLink = within(sidebar).getByRole('link', { name: 'Cursos' });

    expect(sidebar).toBeInTheDocument();
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });

  it('should render catalog summary cards from the course list', () => {
    renderPage();

    expect(screen.getByRole('article', { name: 'Total de Cursos' })).toHaveTextContent('3');
    expect(screen.getByRole('article', { name: 'Cursos Publicados' })).toHaveTextContent('2');
    expect(screen.getByText('1 em rascunho')).toBeInTheDocument();
    // (249,90 + 329,90 + 189,90) / 3 = 256,57, exibido sem centavos.
    expect(screen.getByRole('article', { name: 'Média de Preço' })).toHaveTextContent(/R\$\s*257/);
  });

  it('should list the catalog courses in the table', () => {
    renderPage();

    const table = screen.getByRole('table', { name: 'Cursos cadastrados' });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Curso' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Categoria' })).toBeInTheDocument();
    expect(within(table).getByText('Atendimento de Excelencia em Hospedagem')).toBeInTheDocument();
    expect(within(table).getByText('Gestao de Reservas e Overbooking')).toBeInTheDocument();
    expect(within(table).getByText('Ingles para Recepcao')).toBeInTheDocument();
    expect(within(table).getByText('Hospitalidade')).toBeInTheDocument();
    expect(within(table).getByText('Gestão')).toBeInTheDocument();
    expect(within(table).getByText('Idiomas')).toBeInTheDocument();
    expect(screen.queryByText('AE')).not.toBeInTheDocument();
    expect(within(table).getAllByText('Publicado')).toHaveLength(2);
    expect(within(table).getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 3 de 3 cursos')).toBeInTheDocument();
  });

  it('should offer a shortcut to the Course Builder', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Novo Curso' })).toHaveAttribute(
      'href',
      '/admin/cursos/novo',
    );
  });

  it('should filter the table as the search value changes', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: /buscar curso/i }), 'ingles');

    expect(screen.getByText('Ingles para Recepcao')).toBeInTheDocument();
    expect(screen.queryByText('Atendimento de Excelencia em Hospedagem')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 3 cursos')).toBeInTheDocument();
  });

  it('should filter the table by category', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Categoria'), 'Idiomas');

    expect(screen.getByText('Ingles para Recepcao')).toBeInTheDocument();
    expect(screen.queryByText('Atendimento de Excelencia em Hospedagem')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestao de Reservas e Overbooking')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 3 cursos')).toBeInTheDocument();
  });

  it('should filter the table by status', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Status'), 'DRAFT');

    expect(screen.getByText('Ingles para Recepcao')).toBeInTheDocument();
    expect(screen.queryByText('Atendimento de Excelencia em Hospedagem')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestao de Reservas e Overbooking')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 3 cursos')).toBeInTheDocument();
  });

  it('should open a destructive confirmation modal before archiving a course', async () => {
    const archiveCourse = vi.fn().mockResolvedValue(undefined);
    useAdminCoursesMock.mockReturnValue({
      courses: COURSES,
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse,
      unarchiveCourse: vi.fn(),
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Arquivar Ingles para Recepcao' }));

    expect(archiveCourse).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Arquivar curso?' })).toHaveTextContent(
      'Ingles para Recepcao',
    );

    await user.click(screen.getByRole('button', { name: 'Arquivar curso' }));

    expect(archiveCourse).toHaveBeenCalledWith('e0000000-0000-4000-e000-000000000003');
  });

  it('should open a success confirmation modal before unarchiving a course', async () => {
    const unarchiveCourse = vi.fn().mockResolvedValue(undefined);
    const archivedCourse: AdminCourseRow = {
      ...COURSES[2],
      status: 'ARCHIVED',
    };
    useAdminCoursesMock.mockReturnValue({
      courses: [archivedCourse],
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse: vi.fn(),
      unarchiveCourse,
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Desarquivar Ingles para Recepcao' }));

    expect(unarchiveCourse).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Desarquivar curso?' })).toHaveTextContent(
      'Ingles para Recepcao',
    );

    await user.click(screen.getByRole('button', { name: 'Desarquivar curso' }));

    expect(unarchiveCourse).toHaveBeenCalledWith('e0000000-0000-4000-e000-000000000003');
  });

  it('should not archive a course when the confirmation is cancelled', async () => {
    const archiveCourse = vi.fn().mockResolvedValue(undefined);
    useAdminCoursesMock.mockReturnValue({
      courses: COURSES,
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse,
      unarchiveCourse: vi.fn(),
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Arquivar Ingles para Recepcao' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(archiveCourse).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Arquivar curso?' })).not.toBeInTheDocument();
  });

  it('should link each row to the course editor', () => {
    renderPage();

    expect(
      screen.getByRole('link', { name: 'Editar Atendimento de Excelencia em Hospedagem' }),
    ).toHaveAttribute('href', '/admin/cursos/e0000000-0000-4000-e000-000000000001/editar');
  });

  it('should allow retrying when the catalog fails to load', async () => {
    const reload = vi.fn();
    useAdminCoursesMock.mockReturnValue({
      courses: [],
      status: 'error',
      errorMessage: 'Não foi possível carregar os cursos.',
      reload,
      archiveCourse: vi.fn(),
      unarchiveCourse: vi.fn(),
    });

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os cursos');
    await user.click(screen.getByRole('button', { name: 'Tentar Novamente' }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
