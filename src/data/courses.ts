import type { CourseSummary } from '@/types/course';

export const featuredCourse: CourseSummary = {
  id: 'ia-aplicada-ao-turismo',
  title: 'IA Aplicada ao Turismo',
  thumbnailUrl: null,
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
  teaserUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  materials: [
    {
      title: 'Guia de Prompts para Turismo',
      format: 'PDF',
      fileUrl: 'https://cdn.escapa.com/materials/guia-prompts.pdf',
    },
    {
      title: 'Planilha de Automação de Processos',
      format: 'Excel',
      fileUrl: 'https://cdn.escapa.com/materials/planilha-automacao.xlsx',
    },
    {
      title: 'Mapa de Ferramentas de IA 2025',
      format: 'PDF',
      fileUrl: 'https://cdn.escapa.com/materials/mapa-ferramentas.pdf',
    },
  ],
  modules: [
    {
      id: 'fundamentos-ia',
      title: 'Fundamentos de IA para o Turismo',
      lessonCount: 4,
      totalMinutes: 55,
      lessons: [
        {
          id: 'o-que-e-ia',
          title: 'O que é Inteligência Artificial?',
          type: 'video',
          durationMinutes: 12,
          isFree: true,
        },
        {
          id: 'ia-turismo-global',
          title: 'IA no Contexto do Turismo Global',
          type: 'video',
          durationMinutes: 18,
          isFree: true,
        },
        {
          id: 'ferramentas-disponiveis',
          title: 'Panorama das Ferramentas Disponíveis',
          type: 'text',
          durationMinutes: 15,
        },
        { id: 'quiz-fundamentos', title: 'Quiz: Fundamentos', type: 'quiz', durationMinutes: 10 },
      ],
    },
    {
      id: 'chatgpt',
      title: 'ChatGPT e Modelos de Linguagem',
      lessonCount: 5,
      totalMinutes: 107,
      lessons: [
        {
          id: 'prompts-turismo',
          title: 'Prompts para Experiências Turísticas',
          type: 'video',
          durationMinutes: 24,
          isFree: true,
        },
        {
          id: 'roteiros-chatgpt',
          title: 'Criando Roteiros com ChatGPT',
          type: 'video',
          durationMinutes: 22,
        },
        {
          id: 'conteudo-ia',
          title: 'Conteúdo de Marketing com IA',
          type: 'text',
          durationMinutes: 18,
        },
        {
          id: 'assistentes-virtuais',
          title: 'Assistentes Virtuais para Atendimento',
          type: 'video',
          durationMinutes: 25,
        },
        {
          id: 'quiz-linguagem',
          title: 'Quiz: Modelos de Linguagem',
          type: 'quiz',
          durationMinutes: 18,
        },
      ],
    },
    {
      id: 'automacao',
      title: 'Automação e Análise de Dados',
      lessonCount: 4,
      totalMinutes: 98,
      lessons: [
        {
          id: 'processos-repetitivos',
          title: 'Mapeando Processos Repetitivos',
          type: 'video',
          durationMinutes: 25,
          isFree: true,
        },
        {
          id: 'planilhas-automacao',
          title: 'Automação de Planilhas',
          type: 'text',
          durationMinutes: 24,
        },
        {
          id: 'indicadores-turismo',
          title: 'Indicadores para o Turismo',
          type: 'video',
          durationMinutes: 29,
        },
        { id: 'quiz-dados', title: 'Quiz: Análise de Dados', type: 'quiz', durationMinutes: 20 },
      ],
    },
    {
      id: 'projeto-final',
      title: 'Projeto Final e Certificação',
      lessonCount: 2,
      totalMinutes: 60,
      lessons: [
        {
          id: 'projeto-aplicado',
          title: 'Projeto Aplicado ao seu Negócio',
          type: 'video',
          durationMinutes: 35,
        },
        {
          id: 'certificacao',
          title: 'Avaliação e Certificação',
          type: 'quiz',
          durationMinutes: 25,
        },
      ],
    },
  ],
};

export const getCourseById = (courseId: string): CourseSummary | undefined =>
  courseId === featuredCourse.id ? featuredCourse : undefined;
