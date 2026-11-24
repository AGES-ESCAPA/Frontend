import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MyCourses } from './MyCourses';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearResourceCache } from '@services/resourceCache';
import * as enrollmentService from '../../services/enrollmentService';
import * as curriculumService from '../../services/curriculumService';
import type { StudentCourseCardResponse } from '../../services/enrollmentService';

vi.mock('../../services/enrollmentService', () => ({
  getStudentEnrollments: vi.fn(),
}));

vi.mock('../../services/curriculumService', () => ({
  getStudentCurriculum: vi.fn(),
}));

const getEnrollmentsMock = vi.mocked(enrollmentService.getStudentEnrollments);
const getCurriculumMock = vi.mocked(curriculumService.getStudentCurriculum);

const pendingCourse: StudentCourseCardResponse = {
  courseId: '1',
  title: 'Curso Pendente',
  instructor: null,
  thumbnailUrl: null,
  durationTime: null,
  enrollmentStatus: 'PENDING',
  lessonsCount: 10,
  progressPercentage: null,
};

const completedCourse: StudentCourseCardResponse = {
  courseId: '3',
  title: 'Curso Concluído',
  instructor: null,
  thumbnailUrl: null,
  durationTime: null,
  enrollmentStatus: 'COMPLETED',
  lessonsCount: 8,
  progressPercentage: 100,
  certificateCode: 'CERT-123',
};

const inProgressCourse: StudentCourseCardResponse = {
  courseId: '2',
  title: 'Curso em Andamento',
  instructor: null,
  thumbnailUrl: null,
  durationTime: null,
  enrollmentStatus: 'IN_PROGRESS',
  lessonsCount: 10,
  progressPercentage: 50,
};

const buildPage = (content: StudentCourseCardResponse[]) => ({
  content,
  pageNumber: 0,
  pageSize: 10,
  totalPages: content.length > 0 ? 1 : 0,
  totalElements: content.length,
});

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/meus-cursos']}>
      <Routes>
        <Route path="/meus-cursos" element={<MyCourses />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe('MyCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResourceCache();
    sessionStorage.clear();
    getEnrollmentsMock.mockResolvedValue(buildPage([pendingCourse, inProgressCourse]));
  });

  it('renders the student cards from the api grouped by status', async () => {
    renderPage();

    expect(await screen.findByText('Curso Pendente')).toBeInTheDocument();
    expect(screen.getByText('Curso em Andamento')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^em andamento/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /^aguardando liberação/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: /progresso do curso curso em andamento/i }),
    ).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('button', { name: 'Aguardando' })).toBeDisabled();
  });

  it('requests and shows only the courses of the selected status tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Curso em Andamento');
    getEnrollmentsMock.mockResolvedValue(buildPage([pendingCourse]));

    await user.click(screen.getByRole('tab', { name: 'Aguardando' }));

    await waitFor(() => {
      expect(getEnrollmentsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'PENDING', page: 0 }),
      );
    });
    expect(await screen.findByText('Curso Pendente')).toBeInTheDocument();
    expect(screen.queryByText('Curso em Andamento')).not.toBeInTheDocument();
  });

  it('opens the first available lesson when the student continues a course', async () => {
    const user = userEvent.setup();
    getCurriculumMock.mockResolvedValue({
      courseId: inProgressCourse.courseId,
      completedLessons: 1,
      totalLessons: 2,
      modules: [
        {
          id: 'module-1',
          title: 'Módulo 1',
          locked: false,
          completedLessons: 1,
          totalLessons: 2,
          lessons: [
            { id: 'lesson-1', title: 'Aula 1', durationMinutes: 10, status: 'COMPLETED' },
            { id: 'lesson-2', title: 'Aula 2', durationMinutes: 10, status: 'AVAILABLE' },
          ],
        },
      ],
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Continuar Aula' }));

    expect(await screen.findByTestId('location')).toHaveTextContent(
      `/aluno/cursos/${inProgressCourse.courseId}/aulas/lesson-2`,
    );
  });

  it('falls back to the course details when the curriculum cannot be loaded', async () => {
    const user = userEvent.setup();
    getCurriculumMock.mockRejectedValue(new Error('network'));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Continuar Aula' }));

    expect(await screen.findByTestId('location')).toHaveTextContent(
      `/cursos/${inProgressCourse.courseId}`,
    );
  });

  it('shows the error message with a retry action when the api fails', async () => {
    getEnrollmentsMock.mockRejectedValue(new Error('Erro ao carregar cursos'));
    renderPage();

    expect(await screen.findByText('Erro ao carregar cursos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.queryByText('Nenhum curso encontrado')).not.toBeInTheDocument();
  });

  it('shows the empty state when the api returns empty', async () => {
    getEnrollmentsMock.mockResolvedValue(buildPage([]));
    renderPage();

    expect(await screen.findByText('Nenhum curso encontrado')).toBeInTheDocument();
  });

  it('loads more courses when Carregar mais is clicked', async () => {
    const user = userEvent.setup();
    getEnrollmentsMock
      .mockResolvedValueOnce({
        content: [inProgressCourse],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 2,
        totalElements: 11,
      })
      .mockResolvedValueOnce({
        content: [{ ...inProgressCourse, courseId: 'extra-1', title: 'Curso extra' }],
        pageNumber: 1,
        pageSize: 10,
        totalPages: 2,
        totalElements: 11,
      });

    renderPage();

    await screen.findByText('Curso em Andamento');
    await user.click(screen.getByRole('button', { name: 'Carregar mais' }));

    expect(await screen.findByText('Curso extra')).toBeInTheDocument();
    expect(getEnrollmentsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, size: 10 }),
    );
  });

  it('searches courses after debouncing the search input', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();

    try {
      renderPage();
      await screen.findByText('Curso em Andamento');

      await user.type(screen.getByRole('textbox', { name: 'Buscar em meus cursos' }), 'design');

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(getEnrollmentsMock).toHaveBeenLastCalledWith(
          expect.objectContaining({ query: 'design', page: 0 }),
        );
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('navigates to the certificate when the student opens a completed course', async () => {
    const user = userEvent.setup();
    getEnrollmentsMock.mockResolvedValue(buildPage([completedCourse]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Visualizar Certificado' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/certificados/CERT-123');
  });

  it('shows completed and in-progress sections when viewing Todos', async () => {
    getEnrollmentsMock.mockResolvedValue(
      buildPage([pendingCourse, inProgressCourse, completedCourse]),
    );
    renderPage();

    expect(await screen.findByText('Curso em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Curso Pendente')).toBeInTheDocument();
    expect(screen.getByText('Curso Concluído')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^concluídos/i })).toBeInTheDocument();
  });

  it('navigates to the catalog when the empty state action is clicked', async () => {
    const user = userEvent.setup();
    getEnrollmentsMock.mockResolvedValue(buildPage([]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Explorar Catálogo' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/aluno/cursos');
  });
});
