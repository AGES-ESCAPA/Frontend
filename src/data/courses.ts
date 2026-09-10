import type { CourseSummary } from '@/types/course';

export const featuredCourse: CourseSummary = {
  id: 'ia-aplicada-ao-turismo',
  title: 'IA Aplicada ao Turismo',
  category: 'Inteligência Artificial',
  level: 'Iniciante',
  description:
    'Domine as ferramentas de inteligência artificial para transformar sua operação turística.',
  rating: 4.9,
  reviewsCount: 247,
  studentsCount: 1840,
  durationHours: 12,
  accessPeriod: 'Acesso vitalício',
  price: 'R$ 97',
  instructor: {
    name: 'Dra. Mariana Fonseca',
    role: 'Pesquisadora em Turismo e IA — ESCAPA',
  },
  benefits: [
    'Acesso em qualquer dispositivo',
    'Certificado digital ao concluir',
    'Acesso vitalício ao conteúdo',
  ],
};

export const getCourseById = (courseId: string): CourseSummary | undefined =>
  courseId === featuredCourse.id ? featuredCourse : undefined;
