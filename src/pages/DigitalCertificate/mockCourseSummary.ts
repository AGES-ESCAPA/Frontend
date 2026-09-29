import type { CourseCardProps } from '@components/ui';

export type CourseSummary = Omit<CourseCardProps, 'onClick'>;

/**
 * Dados mockados (US-18) do painel "Sobre o curso", indexados pelo nome do
 * curso do certificado. Sem endpoint de detalhes do certificado ainda, então
 * o vínculo é pelo nome — trocar por um courseId real é um ajuste só aqui.
 */
export const MOCK_COURSE_SUMMARIES: Record<string, CourseSummary> = {
  'Marketing Digital para Hospitalidade': {
    id: '2',
    imageUrl:
      'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=600',
    category: 'marketing',
    level: 'intermediate',
    title: 'Marketing Digital para Hospitalidade',
    description: 'Estratégias de marketing digital para hotéis, pousadas e operadoras de turismo',
    rating: 4.7,
    reviewsCount: 98,
    duration: '16 horas',
    lessonsCount: 44,
    instructor: 'Paulo Henrique',
    price: 'R$ 249,90',
  },
  'IA Aplicada ao Turismo': {
    id: '1',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
    category: 'ai',
    level: 'advanced',
    title: 'IA Aplicada ao Turismo',
    description:
      'Domine as ferramentas de inteligência artificial para transformar sua operação turística',
    rating: 4.9,
    reviewsCount: 156,
    duration: '12 horas',
    lessonsCount: 32,
    instructor: 'Dra. Mariana',
    price: 'R$ 349,90',
  },
};
