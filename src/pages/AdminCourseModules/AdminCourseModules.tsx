import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CourseModulesBuilder } from '@components/course';
import { Sidebar, SIDEBAR_MENU_PRESETS } from '@components/layout';
import { courseModulesApi } from '@services/courseModules';
import type { CourseModule } from '@services/courseModules';
import styles from './AdminCourseModules.module.css';

const adminUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

const sampleModules: CourseModule[] = [
  {
    id: 1,
    title: 'Fundamentos da Web',
    order: 1,
    totalContents: 2,
    totalDurationMinutes: 150,
    contents: [
      { id: 101, title: '1.1 Introdução ao HTML5 e Semântica', type: 'VIDEO', order: 1 },
      { id: 102, title: '1.2 Estrutura básica de um documento', type: 'TEXT', order: 2 },
    ],
  },
  {
    id: 2,
    title: 'Estilização com CSS',
    order: 2,
    totalContents: 0,
    totalDurationMinutes: 0,
    contents: [],
  },
];

export const AdminCourseModules = () => {
  const { courseId = 'novo' } = useParams();
  const [modules, setModules] = useState<CourseModule[]>(sampleModules);
  const adminItems = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
    ...item,
    active: item.route === '/admin/cursos',
  }));

  useEffect(() => {
    let isActive = true;

    courseModulesApi
      .listModules(courseId)
      .then((loadedModules) => {
        if (isActive) {
          setModules(loadedModules);
        }
      })
      .catch(() => {
        if (isActive) {
          setModules(sampleModules);
        }
      });

    return () => {
      isActive = false;
    };
  }, [courseId]);

  return (
    <div className={styles.page}>
      <Sidebar role="admin" items={adminItems} user={adminUser} collapsed={false} />

      <div className={styles.contentShell}>
        <main className={styles.main}>
          <CourseModulesBuilder courseId={courseId} initialModules={modules} />
        </main>
      </div>
    </div>
  );
};
