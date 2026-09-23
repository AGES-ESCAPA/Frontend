import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MyCourses } from './MyCourses';
import { vi } from 'vitest';
import * as enrollmentService from '../../services/enrollmentService';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../services/enrollmentService', () => ({
  getStudentEnrollments: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('MyCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@escapa.com', role: 'STUDENT' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(enrollmentService.getStudentEnrollments).mockResolvedValue({
      content: [
        {
          courseId: '1',
          title: 'Curso Pendente',
          instructor: null,
          thumbnailUrl: null,
          durationTime: null,
          enrollmentStatus: 'PENDING',
          lessonsCount: 10,
          progressPercentage: null,
        },
        {
          courseId: '2',
          title: 'Curso em Andamento',
          instructor: null,
          thumbnailUrl: null,
          durationTime: null,
          enrollmentStatus: 'IN_PROGRESS',
          lessonsCount: 10,
          progressPercentage: 50,
        },
      ],
      pageNumber: 0,
      pageSize: 10,
      totalPages: 1,
      totalElements: 2,
    });
  });

  it('renders student cards from the api', async () => {
    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Curso Pendente')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: 'Aguardando' })).toHaveLength(1);
  });

  it('filters the cards by enrollment status via tab click', async () => {
    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Curso Pendente')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('tab', { name: 'Aguardando' }));

    await waitFor(() => {
      expect(enrollmentService.getStudentEnrollments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' }),
      );
    });
  });

  it('shows the empty state when the api returns empty', async () => {
    vi.mocked(enrollmentService.getStudentEnrollments).mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,
    });

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum curso encontrado')).toBeInTheDocument();
    });
  });
});
