import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOptionalAuth } from '@contexts/useAuth';
import { courseService } from '@services/courseService';
import type { PublicCourseDetails, PublicCoursesPage } from '@/types/course';
import { CourseDetails } from './CourseDetails';

vi.mock('@services/courseService', () => ({
  courseService: {
    getCourses: vi.fn(),
    getCourseFilters: vi.fn(),
    getPublicCourseById: vi.fn(),
  },
}));

vi.mock('@contexts/useAuth', () => ({
  useOptionalAuth: vi.fn(() => null),
  useAuth: vi.fn(),
}));

vi.mock('@hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

vi.mock('@pages/Courses/Courses', () => ({
  Courses: ({ layoutRole }: { layoutRole?: string }) => (
    <div data-testid="authenticated-catalog-backdrop" data-role={layoutRole ?? 'student'}>
      Catálogo autenticado
    </div>
  ),
}));

const getCoursesMock = vi.mocked(courseService.getCourses);
const getFiltersMock = vi.mocked(courseService.getCourseFilters);
const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);
const useOptionalAuthMock = vi.mocked(useOptionalAuth);

const emptyPage: PublicCoursesPage = {
  content: [],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0,
};

const details: PublicCourseDetails = {
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência em Hospedagem',
  shortDescription: 'A jornada do hospede...',
  description: 'A jornada do hospede, do check-in ao pos-estadia.',
  category: 'Hospitalidade',
  level: 'INICIANTE',
  durationTime: 480,
  price: 249.9,
  deadline: null,
  thumbnailUrl: null,
  teaserVideoUrl: null,
  rating: 4.5,
  reviewsCount: 2,
  studentsCount: 80,
  instructor: {
    id: 'inst-1',
    name: 'Beatriz Nunes',
    headline: 'Especialista em hospedagem',
    bio: 'Doze anos coordenando recepção e governança em hotéis de praia.',
    avatarUrl: null,
  },
  learningObjectives: ['Atender com excelência'],
  materials: [
    {
      title: 'Guia de Prompts para Turismo',
      format: 'PDF',
      fileUrl: 'https://cdn.escapa.com/materials/guia-prompts.pdf',
    },
  ],
  modules: [],
};

const renderDetails = (courseId = details.id) =>
  render(
    <MemoryRouter initialEntries={[`/cursos/${courseId}`]}>
      <Routes>
        <Route path="/" element={<p>Vitrine</p>} />
        <Route path="/cursos/:courseId" element={<CourseDetails />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CourseDetails', () => {
  beforeEach(() => {
    getCoursesMock.mockReset().mockResolvedValue(emptyPage);
    getFiltersMock.mockReset().mockResolvedValue({ categories: [], levels: [] });
    getPublicCourseByIdMock.mockReset();
    useOptionalAuthMock.mockReset().mockReturnValue(null);
  });

  it('should open the course details from the public API', async () => {
    getPublicCourseByIdMock.mockResolvedValue(details);
    renderDetails();

    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByRole('heading', { name: details.title, level: 2 }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Hospitalidade')).toBeInTheDocument();
    expect(within(dialog).getByText('Iniciante')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Sobre o Instrutor' })).toBeInTheDocument();
    expect(
      within(dialog).getByText('Doze anos coordenando recepção e governança em hotéis de praia.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Materiais Inclusos' })).toBeInTheDocument();
    expect(within(dialog).getByText('Guia de Prompts para Turismo (PDF)')).toBeInTheDocument();
    expect(within(dialog).getByText('Vídeo não disponível para esse curso')).toBeInTheDocument();
    expect(getPublicCourseByIdMock).toHaveBeenCalledWith(details.id, expect.any(AbortSignal));
  });

  it('should close the modal and return to the logged catalog it was opened from', async () => {
    const user = userEvent.setup();
    getPublicCourseByIdMock.mockResolvedValue(details);
    render(
      <MemoryRouter
        initialEntries={[{ pathname: `/cursos/${details.id}`, state: { from: '/aluno/cursos' } }]}
      >
        <Routes>
          <Route path="/" element={<p>Vitrine</p>} />
          <Route path="/aluno/cursos" element={<p>Catálogo do aluno</p>} />
          <Route path="/cursos/:courseId" element={<CourseDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: /^fechar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Catálogo do aluno')).toBeInTheDocument();
    });
    expect(screen.queryByText('Vitrine')).not.toBeInTheDocument();
  });

  it('should close the modal and return to the home page', async () => {
    const user = userEvent.setup();
    getPublicCourseByIdMock.mockResolvedValue(details);
    renderDetails();

    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: /^fechar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Vitrine')).toBeInTheDocument();
    });
  });

  it('should keep the authenticated chrome behind the modal for a logged-in student', async () => {
    useOptionalAuthMock.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jorge Amado',
        email: 'aluno@email.com',
        role: 'STUDENT',
      },
      isAuthenticated: true,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
    getPublicCourseByIdMock.mockResolvedValue(details);

    renderDetails();

    await screen.findByRole('dialog');

    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Começar Agora/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('authenticated-catalog-backdrop')).toHaveAttribute(
      'data-role',
      'student',
    );
  });

  it('should close without from and return to the catalog of the logged-in profile', async () => {
    const user = userEvent.setup();
    useOptionalAuthMock.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jorge Amado',
        email: 'aluno@email.com',
        role: 'STUDENT',
      },
      isAuthenticated: true,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
    getPublicCourseByIdMock.mockResolvedValue(details);

    render(
      <MemoryRouter initialEntries={[`/cursos/${details.id}`]}>
        <Routes>
          <Route path="/" element={<p>Vitrine</p>} />
          <Route path="/aluno/cursos" element={<p>Catálogo do aluno</p>} />
          <Route path="/cursos/:courseId" element={<CourseDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: /^fechar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Catálogo do aluno')).toBeInTheDocument();
    });
    expect(screen.queryByText('Vitrine')).not.toBeInTheDocument();
  });
});
