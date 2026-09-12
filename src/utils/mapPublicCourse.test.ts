import { describe, expect, it, vi } from 'vitest';
import type { PublicCourseCard, PublicCourseDetails } from '@/types/course';
import {
  mapCourseCategory,
  mapCourseLevel,
  mapPublicCourseDetailsToSummary,
  mapPublicCourseToCardProps,
  toApiLevel,
  toDisplayLevel,
} from './mapPublicCourse';

const course: PublicCourseCard = {
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência em Hospedagem',
  shortDescription: 'A jornada do hospede...',
  category: 'Hospitalidade',
  level: 'INICIANTE',
  durationTime: 480,
  lessonsCount: 5,
  price: 249.9,
  thumbnailUrl: 'https://cdn.escapa.com/courses/atendimento.jpg',
  instructor: 'Beatriz Nunes',
  ratingAverage: 4.5,
  reviewsCount: 2,
};

describe('mapPublicCourse', () => {
  it('should map API categories to badge keys', () => {
    expect(mapCourseCategory('Inteligência Artificial')).toBe('ai');
    expect(mapCourseCategory('Hospitalidade')).toBe('hospitality');
  });

  it('should map API levels in any casing to CourseCard levels', () => {
    expect(mapCourseLevel('Iniciante')).toBe('basic');
    expect(mapCourseLevel('INICIANTE')).toBe('basic');
    expect(mapCourseLevel('INTERMEDIARIO')).toBe('intermediate');
    expect(mapCourseLevel('Avançado')).toBe('advanced');
  });

  it('should convert vitrine labels to the backend level query', () => {
    expect(toApiLevel('Iniciante')).toBe('INICIANTE');
    expect(toApiLevel('Intermediário')).toBe('INTERMEDIARIO');
    expect(toApiLevel('Avançado')).toBe('AVANCADO');
    expect(toApiLevel('INICIANTE')).toBe('INICIANTE');
  });

  it('should map a public course to CourseCard props with BRL price', () => {
    const onClick = vi.fn();
    const props = mapPublicCourseToCardProps(course, onClick);

    expect(props.id).toBe(course.id);
    expect(props.category).toBe('hospitality');
    expect(props.level).toBe('basic');
    expect(props.description).toBe(course.shortDescription);
    expect(props.duration).toBe('8h');
    expect(props.price).toMatch(/R\$\s*249/);
    props.onClick(course.id);
    expect(onClick).toHaveBeenCalledWith(course.id);
  });

  it('should map public course details to the CourseDetails summary', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: 'Descrição completa do curso.',
      category: 'Hospitalidade',
      level: 'INICIANTE',
      durationTime: 480,
      price: 249.9,
      deadline: null,
      thumbnailUrl: course.thumbnailUrl,
      rating: 4.5,
      reviewsCount: 2,
      studentsCount: 80,
      instructor: {
        id: 'inst-1',
        name: 'Beatriz Nunes',
        headline: 'Especialista em hospedagem',
        bio: null,
      },
      learningObjectives: ['Atender com excelência'],
      materials: [
        {
          title: 'Guia de Prompts',
          format: 'PDF',
          fileUrl: 'https://cdn.escapa.com/guia.pdf',
        },
      ],
      modules: [
        {
          id: 'mod-1',
          title: 'Recepção',
          order: 1,
          totalContents: 1,
          durationMinutes: 20,
          contents: [
            {
              id: 'lesson-1',
              title: 'Check-in',
              type: 'VIDEO',
              order: 1,
              durationMinutes: 20,
              isFree: true,
              url: 'https://cdn.escapa.com/teaser.mp4',
            },
          ],
        },
      ],
    };

    const summary = mapPublicCourseDetailsToSummary(details);

    expect(toDisplayLevel('INICIANTE')).toBe('Iniciante');
    expect(summary.level).toBe('Iniciante');
    expect(summary.category).toBe('Hospitalidade');
    expect(summary.durationHours).toBe(8);
    expect(summary.instructor.name).toBe('Beatriz Nunes');
    expect(summary.thumbnailUrl).toBe(course.thumbnailUrl);
    expect(summary.materials).toEqual(details.materials);
    expect(summary.teaserUrl).toBe('https://cdn.escapa.com/teaser.mp4');
    expect(summary.modules[0].lessons[0].type).toBe('video');
  });
});
