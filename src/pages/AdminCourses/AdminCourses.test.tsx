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
    price: 249.9,
    status: 'PUBLISHED',
    version: 'v1.2',
  },
  {
    id: 'e0000000-0000-4000-e000-000000000002',
    code: 'GR',
    title: 'Gestao de Reservas e Overbooking',
    price: 329.9,
    status: 'PUBLISHED',
    version: 'v2.0',
  },
  {
    id: 'e0000000-0000-4000-e000-000000000003',
    code: 'IR',
    title: 'Ingles para Recepcao',
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
    });
  });

  it('should integrate the admin Sidebar with Course Management as the current section', () => {
    renderPage();

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — admin/i });
    const currentLink = within(sidebar).getByRole('link', { name: 'Gestão de Cursos' });

    expect(sidebar).toBeInTheDocument();
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });

  it('should render catalog summary cards from the course list', () => {
    renderPage();

    expect(screen.getByRole('article', { name: 'Total de Cursos' })).toHaveTextContent('3');
    expect(screen.getByRole('article', { name: 'Cursos Publicados' })).toHaveTextContent('2');
    expect(screen.getByText('1 em rascunho')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Média de Preço' })).toHaveTextContent('R$');
  });

  it('should list the catalog courses in the table', () => {
    renderPage();

    expect(screen.getByRole('table', { name: 'Cursos cadastrados' })).toBeInTheDocument();
    expect(screen.getByText('Atendimento de Excelencia em Hospedagem')).toBeInTheDocument();
    expect(screen.getByText('Gestao de Reservas e Overbooking')).toBeInTheDocument();
    expect(screen.getByText('Ingles para Recepcao')).toBeInTheDocument();
    expect(screen.getAllByText('Publicado')).toHaveLength(2);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
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

  it('should open a destructive confirmation modal before archiving a course', async () => {
    const archiveCourse = vi.fn().mockResolvedValue(undefined);
    useAdminCoursesMock.mockReturnValue({
      courses: COURSES,
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse,
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Excluir Ingles para Recepcao' }));

    expect(archiveCourse).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Excluir curso?' })).toHaveTextContent(
      'Ingles para Recepcao',
    );

    await user.click(screen.getByRole('button', { name: 'Excluir curso' }));

    expect(archiveCourse).toHaveBeenCalledWith('e0000000-0000-4000-e000-000000000003');
  });

  it('should not archive a course when the confirmation is cancelled', async () => {
    const archiveCourse = vi.fn().mockResolvedValue(undefined);
    useAdminCoursesMock.mockReturnValue({
      courses: COURSES,
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse,
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Excluir Ingles para Recepcao' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(archiveCourse).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Excluir curso?' })).not.toBeInTheDocument();
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
    });

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os cursos');
    await user.click(screen.getByRole('button', { name: 'Tentar Novamente' }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
