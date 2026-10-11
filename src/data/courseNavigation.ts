import type { CourseNavigationSidebarProps } from '@components/course/CourseNavigationSidebar/CourseNavigationSidebar';

/**
 * Grade de aulas mockada do menu lateral da Sala de Aula (US-13), igual ao
 * protótipo. Será substituída pelos dados da API na integração (#94).
 */
export const mockCourseNavigation: Pick<
  CourseNavigationSidebarProps,
  'completedLessons' | 'totalLessons' | 'modules'
> = {
  completedLessons: 2,
  totalLessons: 13,
  modules: [
    {
      id: 'fundamentos-turismo-receptivo',
      title: 'Fundamentos do Turismo Receptivo',
      locked: false,
      completedLessons: 2,
      totalLessons: 4,
      lessons: [
        {
          id: 'introducao-turismo-aventura',
          title: 'Introdução ao Turismo de Aventura',
          durationMinutes: 12,
          status: 'COMPLETED',
        },
        {
          id: 'planejamento-roteiros',
          title: 'Planejamento de Roteiros Turísticos',
          durationMinutes: 18,
          status: 'COMPLETED',
        },
        {
          id: 'experiencias-imersivas',
          title: 'Experiências Imersivas na Prática',
          durationMinutes: 24,
          status: 'AVAILABLE',
        },
        {
          id: 'pesquisa-destinos',
          title: 'Pesquisa de Destinos e Público-Alvo',
          durationMinutes: 21,
          status: 'LOCKED',
        },
      ],
    },
    {
      id: 'operacao-logistica',
      title: 'Operação e Logística de Viagens',
      locked: true,
      completedLessons: 0,
      totalLessons: 3,
      lessons: [
        {
          id: 'fornecedores',
          title: 'Gestão de Fornecedores',
          durationMinutes: 16,
          status: 'LOCKED',
        },
        {
          id: 'transporte',
          title: 'Transporte e Traslados',
          durationMinutes: 14,
          status: 'LOCKED',
        },
        {
          id: 'contingencias',
          title: 'Plano de Contingências',
          durationMinutes: 19,
          status: 'LOCKED',
        },
      ],
    },
    {
      id: 'marketing-digital',
      title: 'Marketing Digital para Turismo',
      locked: true,
      completedLessons: 0,
      totalLessons: 3,
      lessons: [
        {
          id: 'posicionamento',
          title: 'Posicionamento de Marca',
          durationMinutes: 15,
          status: 'LOCKED',
        },
        {
          id: 'redes-sociais',
          title: 'Redes Sociais e Conteúdo',
          durationMinutes: 22,
          status: 'LOCKED',
        },
        { id: 'anuncios', title: 'Anúncios e Métricas', durationMinutes: 18, status: 'LOCKED' },
      ],
    },
    {
      id: 'empreendedorismo',
      title: 'Empreendedorismo no Turismo',
      locked: true,
      completedLessons: 0,
      totalLessons: 3,
      lessons: [
        { id: 'modelo-negocio', title: 'Modelo de Negócio', durationMinutes: 20, status: 'LOCKED' },
        {
          id: 'precificacao',
          title: 'Precificação de Pacotes',
          durationMinutes: 17,
          status: 'LOCKED',
        },
        {
          id: 'formalizacao',
          title: 'Formalização e Parcerias',
          durationMinutes: 13,
          status: 'LOCKED',
        },
      ],
    },
  ],
};
