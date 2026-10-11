import type { PublicCourseCard, PublicCoursesPage, PublicCoursesQuery } from '@/types/course';

/**
 * Catálogo estático usado enquanto GET /api/v1/public/courses não estiver disponível.
 * Remover o fallback no courseService quando a rota do backend estiver pronta.
 */
export const mockPublicCourses: PublicCourseCard[] = [
  {
    id: 'ia-aplicada-ao-turismo',
    title: 'IA Aplicada ao Turismo',
    shortDescription:
      'Domine as ferramentas de inteligência artificial para transformar sua operação turística.',
    category: 'Inteligência Artificial',
    level: 'Iniciante',
    durationTime: 12,
    lessonsCount: 32,
    price: 97,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    instructor: 'Dra. Mariana',
    ratingAverage: 4.8,
    reviewsCount: 56,
  },
  {
    id: 'marketing-digital-hospitalidade',
    title: 'Marketing Digital para Hospitalidade',
    shortDescription:
      'Estratégias de marketing digital para hotéis, pousadas e operadores de turismo.',
    category: 'Marketing',
    level: 'Intermediário',
    durationTime: 10,
    lessonsCount: 44,
    price: 117,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    instructor: 'Theo Magalhães',
    ratingAverage: 5,
    reviewsCount: 41,
  },
  {
    id: 'experiencia-premium-hospede',
    title: 'Experiência Premium do Hóspede',
    shortDescription:
      'Técnicas e metodologias para criar experiências memoráveis em hospitalidade.',
    category: 'Hospitalidade',
    level: 'Intermediário',
    durationTime: 11,
    lessonsCount: 28,
    price: 87,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    instructor: 'Barbara Diogo',
    ratingAverage: 4.9,
    reviewsCount: 33,
  },
  {
    id: 'inovacao-destinos-turisticos',
    title: 'Inovação em Destinos Turísticos',
    shortDescription:
      'Como criar e gerir destinos turísticos competitivos e inovadores no mercado global.',
    category: 'Inovação',
    level: 'Avançado',
    durationTime: 14,
    lessonsCount: 28,
    price: 127,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    instructor: 'Thanise Magalhães',
    ratingAverage: 4.7,
    reviewsCount: 19,
  },
  {
    id: 'revenue-management-hotelaria',
    title: 'Revenue Management para Hotelaria',
    shortDescription:
      'Estratégias avançadas de precificação e gestão de receita para redes de hospedagem.',
    category: 'Marketing',
    level: 'Avançado',
    durationTime: 16,
    lessonsCount: 17,
    price: 147,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    instructor: 'Camila Torres',
    ratingAverage: 4.8,
    reviewsCount: 12,
  },
  {
    id: 'lideranca-hospitalidade-luxo',
    title: 'Liderança em Hospitalidade de Luxo',
    shortDescription:
      'Desenvolva competências de liderança para o mercado premium de hospedagem e turismo.',
    category: 'Hospitalidade',
    level: 'Avançado',
    durationTime: 18,
    lessonsCount: 35,
    price: 167,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    instructor: 'André Monteiro',
    ratingAverage: 4.9,
    reviewsCount: 38,
  },
];

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const getMockPublicCoursesPage = (query: PublicCoursesQuery = {}): PublicCoursesPage => {
  const pageNumber = query.page !== undefined && query.page >= 0 ? query.page : 0;
  const pageSize = query.size !== undefined && query.size > 0 ? query.size : 10;

  const filtered = mockPublicCourses.filter((course) => {
    const matchesTitle = !query.title || normalize(course.title).includes(normalize(query.title));
    const matchesCategory = !query.category || course.category === query.category;
    const matchesLevel = !query.level || course.level === query.level;
    return matchesTitle && matchesCategory && matchesLevel;
  });

  const start = pageNumber * pageSize;
  const content = filtered.slice(start, start + pageSize);
  const totalElements = filtered.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize);

  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
  };
};
