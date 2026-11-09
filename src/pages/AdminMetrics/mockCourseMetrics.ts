import type { BarListItem } from '@components/ui';
import type { PopularCoursesMetricsData } from '@/types/adminMetrics';

export const MOCK_COURSE_METRICS: PopularCoursesMetricsData = {
  mostAccessedCourse: {
    courseId: 'c0000000-0000-4000-a000-000000000001',
    title: 'Turismo de Aventura',
    enrollments: 4820,
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

export const MOCK_ENGAGED_COMPANIES: BarListItem[] = [
  { id: 'company-1', label: 'Euro Trip', value: 259 },
  { id: 'company-2', label: 'Ibis', value: 206 },
  { id: 'company-3', label: 'CVC', value: 201 },
  { id: 'company-4', label: 'Eco Trip', value: 193 },
  { id: 'company-5', label: 'Voyage', value: 187 },
];
