import type { PopularCoursesMetricsData } from '@/types/adminMetrics';

export const MOCK_COURSE_METRICS: PopularCoursesMetricsData = {
  mostAccessedCourse: {
    courseId: 'c0000000-0000-4000-a000-000000000001',
    title: 'Turismo de Aventura',
    enrollments: 4820,
    enrollmentsLabel: 'Mais de 4,8 mil matrículas',
  },
  topCourses: [
    {
      courseId: 'c0000000-0000-4000-a000-000000000001',
      title: 'Condutor de Turismo de Aventura',
      enrollments: 4820,
    },
    {
      courseId: 'c0000000-0000-4000-a000-000000000002',
      title: 'Ecoturismo e Educação Ambiental',
      enrollments: 3940,
    },
    {
      courseId: 'c0000000-0000-4000-a000-000000000003',
      title: 'Gestão de Pousadas e Hostels',
      enrollments: 3120,
    },
    {
      courseId: 'c0000000-0000-4000-a000-000000000004',
      title: 'Marketing Digital para Destinos',
      enrollments: 2890,
    },
    {
      courseId: 'c0000000-0000-4000-a000-000000000005',
      title: 'Introdução ao Patrimônio Cultural',
      enrollments: 1840,
    },
  ],
  categoriesCount: 5,
  enrollmentsByCategory: [
    { category: 'Hospitalidade', percentage: 45 },
    { category: 'Inteligência Artificial', percentage: 25 },
    { category: 'Inovação', percentage: 18 },
    { category: 'Marketing', percentage: 12 },
  ],
};
