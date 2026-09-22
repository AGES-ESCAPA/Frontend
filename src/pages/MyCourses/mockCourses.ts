export interface Course {
  courseId: string;
  category: string;
  title: string;
  description: string;
  instructor: string;
  progressPercentage: number;
  durationTime: number;
  lessonsCount: number;
  enrollmentStatus: 'IN_PROGRESS' | 'PENDING' | 'COMPLETED';
  thumbnailUrl: string;
}

export const mockCourses: Course[] = [
  {
    courseId: '1',
    category: 'INTELIGÊNCIA ARTIFICIAL',
    title: 'IA Aplicada ao Turismo',
    description:
      'Domine as ferramentas de inteligência artificial para transformar sua operação turística',
    instructor: 'Dra. Mariana',
    progressPercentage: 72,
    durationTime: 12,
    lessonsCount: 32,
    enrollmentStatus: 'IN_PROGRESS',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '2',
    category: 'MARKETING',
    title: 'Marketing Digital para Hospitalidade',
    description: 'Estratégias de marketing digital para hotéis, pousadas e operadoras de turismo',
    instructor: 'Paulo Henrique',
    progressPercentage: 45,
    durationTime: 16,
    lessonsCount: 44,
    enrollmentStatus: 'IN_PROGRESS',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '5',
    category: 'GESTÃO',
    title: 'Gestão Financeira para Pousadas',
    description:
      'Aprenda a controlar o fluxo de caixa, precificar diárias e aumentar a margem de lucro.',
    instructor: 'Roberto Alves',
    progressPercentage: 15,
    durationTime: 8,
    lessonsCount: 20,
    enrollmentStatus: 'IN_PROGRESS',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '3',
    category: 'HOSPITALIDADE',
    title: 'Revenue Management para Hotelaria',
    description:
      'Estratégias avançadas de precificação e gestão de receitas para meios de hospedagem',
    instructor: 'Camila Torres',
    progressPercentage: 0,
    durationTime: 20,
    lessonsCount: 52,
    enrollmentStatus: 'PENDING',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '6',
    category: 'INOVAÇÃO',
    title: 'Inovação em Destinos Turísticos',
    description:
      'Como criar e gerir destinos turísticos competitivos e inovadores no mercado global',
    instructor: 'Thamires Magalhães',
    progressPercentage: 0,
    durationTime: 14,
    lessonsCount: 32,
    enrollmentStatus: 'PENDING',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '4',
    category: 'HOSPITALIDADE',
    title: 'Liderança em Hospitalidade de Luxo',
    description:
      'Desenvolva competências de liderança para o mercado premium de hospedagem e turismo',
    instructor: 'André Monteiro',
    progressPercentage: 100,
    durationTime: 18,
    lessonsCount: 46,
    enrollmentStatus: 'COMPLETED',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '7',
    category: 'ATENDIMENTO',
    title: 'Experiência Premium do Hóspede',
    description: 'Técnicas e metodologias para criar experiências memoráveis em hospitalidade',
    instructor: 'Letícia Amaral',
    progressPercentage: 100,
    durationTime: 10,
    lessonsCount: 28,
    enrollmentStatus: 'COMPLETED',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '8',
    category: 'VENDAS',
    title: 'Vendas B2B no Turismo',
    description: 'Técnicas avançadas de negociação com agências e operadoras corporativas',
    instructor: 'Carlos Silva',
    progressPercentage: 100,
    durationTime: 24,
    lessonsCount: 60,
    enrollmentStatus: 'COMPLETED',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '9',
    category: 'INTELIGÊNCIA ARTIFICIAL',
    title: 'IA Aplicada ao Turismo',
    description:
      'Domine as ferramentas de inteligência artificial para transformar sua operação turística',
    instructor: 'Dra. Mariana',
    progressPercentage: 72,
    durationTime: 12,
    lessonsCount: 32,
    enrollmentStatus: 'IN_PROGRESS',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '10',
    category: 'MARKETING',
    title: 'Marketing Digital para Hospitalidade',
    description: 'Estratégias de marketing digital para hotéis, pousadas e operadoras de turismo',
    instructor: 'Paulo Henrique',
    progressPercentage: 45,
    durationTime: 16,
    lessonsCount: 44,
    enrollmentStatus: 'IN_PROGRESS',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '11',
    category: 'HOSPITALIDADE',
    title: 'Revenue Management para Hotelaria',
    description:
      'Estratégias avançadas de precificação e gestão de receitas para meios de hospedagem',
    instructor: 'Camila Torres',
    progressPercentage: 0,
    durationTime: 20,
    lessonsCount: 52,
    enrollmentStatus: 'PENDING',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
  },
  {
    courseId: '12',
    category: 'HOSPITALIDADE',
    title: 'Liderança em Hospitalidade de Luxo',
    description:
      'Desenvolva competências de liderança para o mercado premium de hospedagem e turismo',
    instructor: 'André Monteiro',
    progressPercentage: 100,
    durationTime: 18,
    lessonsCount: 46,
    enrollmentStatus: 'COMPLETED',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
  },
];
