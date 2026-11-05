import { useMemo } from 'react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import type { PopularCoursesMetricsData } from '@/types/adminMetrics';
import { PopularCoursesSection } from './components/PopularCoursesSection';
import { MOCK_COURSE_METRICS } from './mockCourseMetrics';
import styles from './AdminMetrics.module.css';

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

export interface AdminMetricsProps {
  /** Dados de indicadores de cursos populares já preparados pela camada de integração. */
  courseMetrics?: PopularCoursesMetricsData;
}

export const AdminMetrics = ({ courseMetrics = MOCK_COURSE_METRICS }: AdminMetricsProps) => {
  const menuItems = useMemo(
    () =>
      SIDEBAR_MENU_PRESETS.admin.map((item) => ({
        ...item,
        active: item.route === '/admin/metricas',
      })),
    [],
  );

  return (
    <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER}>
      <div className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.heading}>Métricas da Plataforma</h1>
          <p className={styles.description}>
            Acompanhe os cursos com maior procura e a distribuição de matrículas no catálogo.
          </p>
        </header>

        <PopularCoursesSection
          mostAccessedCourse={courseMetrics.mostAccessedCourse}
          topCourses={courseMetrics.topCourses}
          categoriesCount={courseMetrics.categoriesCount}
          enrollmentsByCategory={courseMetrics.enrollmentsByCategory}
        />
      </div>
    </AuthenticatedLayout>
  );
};
