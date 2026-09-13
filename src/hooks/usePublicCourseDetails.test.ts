import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { PublicCourseDetails } from '@/types/course';
import { usePublicCourseDetails } from './usePublicCourseDetails';

vi.mock('@services/courseService', () => ({
  courseService: {
    getPublicCourseById: vi.fn(),
  },
}));

const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);

const details: PublicCourseDetails = {
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência em Hospedagem',
  shortDescription: 'A jornada do hospede...',
  description: 'Descrição completa.',
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
    bio: null,
    avatarUrl: null,
  },
  learningObjectives: [],
  materials: [],
  modules: [],
};

describe('usePublicCourseDetails', () => {
  beforeEach(() => {
    getPublicCourseByIdMock.mockReset();
  });

  it('should load the public course details by id', async () => {
    getPublicCourseByIdMock.mockResolvedValue(details);

    const { result } = renderHook(() => usePublicCourseDetails(details.id));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(getPublicCourseByIdMock).toHaveBeenCalledWith(details.id, expect.any(AbortSignal));
    expect(result.current.course?.title).toBe(details.title);
    expect(result.current.course?.level).toBe('Iniciante');
  });

  it('should expose an error when the request fails', async () => {
    getPublicCourseByIdMock.mockRejectedValue(new Error('Curso não encontrado.'));

    const { result } = renderHook(() => usePublicCourseDetails(details.id));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.course).toBeNull();
    expect(result.current.errorMessage).toBe('Curso não encontrado.');
  });
});
