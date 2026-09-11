import { render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createCourse, getCourseById, updateCourse } from '@services/courseService';
import type { CourseDetail } from '@/types/course';
import { CourseBuilder } from './CourseBuilder';

vi.mock('@services/courseService', () => ({
  createCourse: vi.fn(),
  getCourseById: vi.fn(),
  updateCourse: vi.fn(),
}));

const SAVED_COURSE: CourseDetail = {
  id: 'c2f1b3a4-0000-4000-8000-000000000001',
  title: 'Fundamentos de Design de Interfaces Corporativas',
  category: 'Design & UX',
  level: 'INICIANTE',
  description: 'Descrição completa do curso.',
  shortDescription: 'Ementa resumida do curso.',
  teaserVideoUrl: 'https://youtube.com/watch?v=aaaaaaaaaaa',
  durationTime: 40,
  deadline: 365,
  price: 499,
  status: 'DRAFT',
};

const renderBuilder = (path = '/admin/cursos/novo'): RenderResult =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/cursos/novo" element={<CourseBuilder />} />
        <Route path="/admin/cursos/:id/editar" element={<CourseBuilder />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CourseBuilder', () => {
  beforeEach(() => {
    vi.mocked(createCourse).mockReset().mockResolvedValue(SAVED_COURSE);
    vi.mocked(updateCourse).mockReset().mockResolvedValue(SAVED_COURSE);
    vi.mocked(getCourseById).mockReset().mockResolvedValue(SAVED_COURSE);
  });

  it('should render every field of the course registration form', () => {
    renderBuilder();

    expect(screen.getByRole('textbox', { name: /título/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /url vídeo teaser/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /resumo curto/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /descrição completa/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /categoria principal/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /carga horária/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /preço base/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /nível de dificuldade/i })).toBeInTheDocument();
  });

  it('should integrate the admin Sidebar with Course Management as the current section', () => {
    renderBuilder();

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — admin/i });
    const currentLink = screen.getByRole('link', { name: 'Gestão de Cursos' });

    expect(sidebar).toBeInTheDocument();
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });

  it('should show a required warning below each blank field when publishing', async () => {
    renderBuilder();

    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    expect(await screen.findAllByText('Preenchimento obrigatório.')).toHaveLength(5);
    expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    expect(screen.getByText('Selecione um nível de dificuldade.')).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should reject zeroed or negative values on price and duration', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /carga horária/i }), '-8');
    await userEvent.type(screen.getByRole('textbox', { name: /preço base/i }), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    expect(await screen.findByText('Informe um valor maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should reject a teaser link that is not a YouTube or Vimeo video', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /url vídeo teaser/i }), 'youtube.com');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    expect(
      await screen.findByText('Informe um link válido do YouTube ou Vimeo.'),
    ).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should submit the draft to the API and confirm it with a toast', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /título/i }), 'Curso de Recepção');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Curso de Recepção', status: 'DRAFT' }),
      );
    });

    expect(await screen.findByText('Rascunho salvo!')).toBeInTheDocument();
  });

  it('should prefill the form with the stored course on the edit route', async () => {
    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);

    await waitFor(() => {
      expect(getCourseById).toHaveBeenCalledWith(SAVED_COURSE.id);
    });

    expect(await screen.findByDisplayValue(SAVED_COURSE.title)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /resumo curto/i })).toHaveValue(
      SAVED_COURSE.shortDescription,
    );
    expect(screen.getByRole('textbox', { name: /descrição completa/i })).toHaveValue(
      SAVED_COURSE.description,
    );
    expect(screen.getByRole('combobox', { name: /categoria principal/i })).toHaveValue(
      SAVED_COURSE.category,
    );
    expect(screen.getByRole('textbox', { name: /carga horária/i })).toHaveValue('40');
    expect(screen.getByRole('textbox', { name: /prazo/i })).toHaveValue('365');
    expect(screen.getByRole('textbox', { name: /preço base/i })).toHaveValue('499');
    expect(screen.getByRole('button', { name: 'Iniciante' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should keep the fields disabled while the stored course is loading', async () => {
    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);

    expect(screen.getByRole('status')).toHaveTextContent(/carregando os dados do curso/i);
    expect(screen.getByRole('textbox', { name: /título/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /título/i })).toBeEnabled();
    });
  });
});
