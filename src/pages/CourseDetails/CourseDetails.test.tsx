import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { PublicCourseDetails, PublicCoursesPage } from '@/types/course';
import { CourseDetails } from './CourseDetails';

vi.mock('@services/courseService', () => ({
  courseService: {
    getCourses: vi.fn(),
    getPublicCourseById: vi.fn(),
  },
}));

const getCoursesMock = vi.mocked(courseService.getCourses);
const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);

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
    getPublicCourseByIdMock.mockReset();
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
});
