import { describe, expect, it, vi } from 'vitest';
import type { CompanyCourse, PublicCourseCard, PublicCourseDetails } from '@/types/course';
import {
  mapCompanyCourseToCardProps,
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

const companyCourse: CompanyCourse = {
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência em Hospedagem',
  shortDescription: 'A jornada do hospede...',
  thumbnailUrl: 'https://cdn.escapa.com/courses/atendimento.jpg',
  category: 'Hospitalidade',
  level: 'INICIANTE',
  durationTime: 480,
  lessonsCount: 15,
  instructorName: 'Beatriz Nunes',
  rating: 4.5,
  acquiredAt: '2026-10-01',
  employeesWithAccess: 12,
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
    expect(summary.instructor.bio).toBe('');
    expect(summary.thumbnailUrl).toBe(course.thumbnailUrl);
    expect(summary.materials).toEqual(details.materials);
    expect(summary.teaserUrl).toBe('https://cdn.escapa.com/teaser.mp4');
    expect(summary.modules[0].lessons[0].type).toBe('video');
  });

  it('should prefer the course teaser URL over a free lesson video', () => {
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
      teaserVideoUrl: 'https://vimeo.com/1226382615?share=copy&fl=sv&fe=ci',
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

    expect(mapPublicCourseDetailsToSummary(details).teaserUrl).toBe(
      'https://vimeo.com/1226382615?share=copy&fl=sv&fe=ci',
    );
  });

  it('should map a company course to an acquired card without access and with employees', () => {
    const onClick = vi.fn();
    const props = mapCompanyCourseToCardProps(companyCourse, onClick);

    expect(props).toMatchObject({
      id: companyCourse.id,
      title: 'Atendimento de Excelência em Hospedagem',
      description: 'A jornada do hospede...',
      category: 'hospitality',
      level: 'basic',
      lessonsCount: 15,
      instructor: 'Beatriz Nunes',
      rating: 4.5,
      acquired: true,
      employeesWithAccess: 12,
    });

    props.onClick(companyCourse.id);
    expect(onClick).toHaveBeenCalledWith(companyCourse.id);
  });

  it('should keep unknown categories and default unknown levels to basic', () => {
    expect(mapCourseCategory('Finanças')).toBe('Finanças');
    expect(mapCourseLevel('Especialista')).toBe('basic');
    expect(toApiLevel('Especialista')).toBe('Especialista');
    expect(toDisplayLevel('desconhecido')).toBe('desconhecido');
  });

  it('should map quiz and text lesson types and deadline-based access', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: null,
      category: 'Marketing',
      level: 'INTERMEDIARIO',
      durationTime: 120,
      price: 99,
      deadline: 90,
      thumbnailUrl: null,
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: null,
      learningObjectives: [],
      materials: [],
      modules: [
        {
          id: 'mod-1',
          title: 'Módulo',
          order: 1,
          totalContents: 2,
          durationMinutes: 30,
          contents: [
            {
              id: 'quiz-1',
              title: 'Quiz',
              type: 'QUIZ',
              order: 1,
              durationMinutes: 5,
              isFree: false,
              url: null,
            },
            {
              id: 'text-1',
              title: 'Leitura',
              type: 'TEXTO',
              order: 2,
              durationMinutes: 10,
              isFree: false,
              url: null,
            },
          ],
        },
      ],
    };

    const summary = mapPublicCourseDetailsToSummary(details);

    expect(summary.accessPeriod).toBe('90 dias de acesso');
    expect(summary.modules[0].lessons.map((item) => item.type)).toEqual(['quiz', 'text']);
  });

  it('should pick the first lesson URL when there is no free video teaser', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: '',
      category: 'Turismo',
      level: 'INICIANTE',
      durationTime: 60,
      price: 49,
      deadline: null,
      thumbnailUrl: null,
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: null,
      learningObjectives: [],
      materials: [],
      modules: [
        {
          id: 'mod-1',
          title: 'Módulo',
          order: 1,
          totalContents: 1,
          durationMinutes: 10,
          contents: [
            {
              id: 'lesson-locked',
              title: 'Aula paga',
              type: 'VIDEO',
              order: 1,
              durationMinutes: 10,
              isFree: false,
              url: 'https://cdn.escapa.com/paid.mp4',
            },
          ],
        },
      ],
    };

    expect(mapPublicCourseDetailsToSummary(details).teaserUrl).toBe(
      'https://cdn.escapa.com/paid.mp4',
    );
  });

  it('should map every known category alias', () => {
    expect(mapCourseCategory('IA')).toBe('ai');
    expect(mapCourseCategory('Marketing')).toBe('marketing');
    expect(mapCourseCategory('Turismo')).toBe('tourism');
    expect(mapCourseCategory('Inovação')).toBe('innovation');
  });

  it('should prefer a free video teaser over the first paid lesson URL', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: '',
      category: 'Turismo',
      level: 'INICIANTE',
      durationTime: 60,
      price: 49,
      deadline: null,
      thumbnailUrl: null,
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: null,
      learningObjectives: [],
      materials: [],
      modules: [
        {
          id: 'mod-1',
          title: 'Módulo',
          order: 1,
          totalContents: 2,
          durationMinutes: 10,
          contents: [
            {
              id: 'lesson-paid',
              title: 'Aula paga',
              type: 'VIDEO',
              order: 1,
              durationMinutes: 5,
              isFree: false,
              url: 'https://cdn.escapa.com/paid.mp4',
            },
            {
              id: 'lesson-free',
              title: 'Amostra grátis',
              type: 'VIDEO',
              order: 2,
              durationMinutes: 5,
              isFree: true,
              url: 'https://cdn.escapa.com/free.mp4',
            },
          ],
        },
      ],
    };

    expect(mapPublicCourseDetailsToSummary(details).teaserUrl).toBe(
      'https://cdn.escapa.com/free.mp4',
    );
  });

  it('should expose lifetime access, instructor avatar and short description fallback', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: 'Resumo curto',
      description: null,
      category: null,
      level: 'AVANCADO',
      durationTime: 61,
      price: null,
      deadline: null,
      thumbnailUrl: 'https://cdn.escapa.com/thumb.jpg',
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: {
        id: 'inst-1',
        name: 'Ana',
        headline: 'Mentora',
        bio: 'Bio completa',
        avatarUrl: 'https://cdn.escapa.com/avatar.png',
      },
      learningObjectives: ['Benefício'],
      materials: [],
      modules: [],
    };

    const summary = mapPublicCourseDetailsToSummary(details);

    expect(summary.accessPeriod).toBe('Acesso vitalício');
    expect(summary.category).toBe('Curso');
    expect(summary.level).toBe('Avançado');
    expect(summary.description).toBe('Resumo curto');
    expect(summary.durationHours).toBe(1);
    expect(summary.instructor).toMatchObject({
      name: 'Ana',
      role: 'Mentora',
      bio: 'Bio completa',
      avatarUrl: 'https://cdn.escapa.com/avatar.png',
    });
  });

  it('should map english TEXT lesson types to text', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: '',
      category: 'Marketing',
      level: 'INICIANTE',
      durationTime: 30,
      price: 10,
      deadline: 15,
      thumbnailUrl: null,
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: null,
      learningObjectives: [],
      materials: [],
      modules: [
        {
          id: 'mod-1',
          title: 'Módulo',
          order: 1,
          totalContents: 1,
          durationMinutes: 10,
          contents: [
            {
              id: 'text-1',
              title: 'Leitura',
              type: 'TEXT',
              order: 1,
              durationMinutes: 10,
              isFree: false,
              url: null,
            },
          ],
        },
      ],
    };

    expect(mapPublicCourseDetailsToSummary(details).modules[0].lessons[0].type).toBe('text');
  });

  it('should normalize level aliases in every direction', () => {
    expect(mapCourseLevel('basic')).toBe('basic');
    expect(mapCourseLevel('intermediate')).toBe('intermediate');
    expect(mapCourseLevel('advanced')).toBe('advanced');
    expect(toApiLevel('basic')).toBe('INICIANTE');
    expect(toApiLevel('intermediate')).toBe('INTERMEDIARIO');
    expect(toDisplayLevel('AVANCADO')).toBe('Avançado');
  });

  it('should default lesson flags and pick quiz videos in the teaser search', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: '',
      category: 'Turismo',
      level: 'INICIANTE',
      durationTime: 30,
      price: 10,
      deadline: null,
      thumbnailUrl: null,
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: null,
      learningObjectives: [],
      materials: [],
      modules: [
        {
          id: 'mod-1',
          title: 'Módulo',
          order: 1,
          totalContents: 1,
          durationMinutes: null,
          contents: [
            {
              id: 'quiz-1',
              title: 'Quiz intro',
              type: 'QUIZ',
              order: 1,
              durationMinutes: null,
              isFree: undefined as unknown as boolean,
              url: null,
            },
          ],
        },
      ],
    };

    const summary = mapPublicCourseDetailsToSummary(details);
    expect(summary.teaserUrl).toBe('');
    expect(summary.modules[0].totalMinutes).toBe(0);
    expect(summary.modules[0].lessons[0]).toMatchObject({
      durationMinutes: 0,
      isFree: false,
      type: 'quiz',
    });
  });

  it('should fall back to the first URL even when it is not a free video', () => {
    const details: PublicCourseDetails = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      description: '',
      category: 'Turismo',
      level: 'INICIANTE',
      durationTime: 30,
      price: 10,
      deadline: null,
      thumbnailUrl: null,
      teaserVideoUrl: null,
      rating: null,
      reviewsCount: null,
      studentsCount: null,
      instructor: null,
      learningObjectives: [],
      materials: [],
      modules: [
        {
          id: 'mod-1',
          title: 'Módulo',
          order: 1,
          totalContents: 1,
          durationMinutes: 5,
          contents: [
            {
              id: 'quiz-1',
              title: 'Quiz com vídeo',
              type: 'QUIZ',
              order: 1,
              durationMinutes: 5,
              isFree: true,
              url: 'https://cdn.escapa.com/quiz.mp4',
            },
          ],
        },
      ],
    };

    expect(mapPublicCourseDetailsToSummary(details).teaserUrl).toBe(
      'https://cdn.escapa.com/quiz.mp4',
    );
  });

  it('should tolerate nullable card fields on public and company courses', () => {
    const onClick = vi.fn();
    const publicProps = mapPublicCourseToCardProps(
      {
        ...course,
        thumbnailUrl: null,
        ratingAverage: null,
        reviewsCount: null,
        lessonsCount: null,
        instructor: null,
        price: null,
        durationTime: null,
      },
      onClick,
    );

    expect(publicProps).toMatchObject({
      imageUrl: '',
      rating: undefined,
      reviewsCount: undefined,
      lessonsCount: 0,
      instructor: 'ESCAPA',
      duration: '0min',
      price: expect.stringMatching(/R\$\s*0/),
    });

    const companyProps = mapCompanyCourseToCardProps(
      { ...companyCourse, category: null, level: null, durationTime: null },
      onClick,
    );

    expect(companyProps.category).toBe('Curso');
    expect(companyProps.level).toBe('basic');
    expect(companyProps.duration).toBe('0min');
  });

  it('should fall back to safe defaults when a company course has missing fields', () => {
    const props = mapCompanyCourseToCardProps(
      {
        ...companyCourse,
        thumbnailUrl: null,
        shortDescription: null,
        rating: null,
        lessonsCount: null,
        instructorName: null,
        employeesWithAccess: 0,
      },
      vi.fn(),
    );

    expect(props.imageUrl).toBe('');
    expect(props.description).toBe('');
    expect(props.rating).toBeUndefined();
    expect(props.lessonsCount).toBe(0);
    expect(props.instructor).toBe('ESCAPA');
    expect(props.employeesWithAccess).toBe(0);
  });
});
