import type { EnrollmentStatus } from '@components/ui';
import { getStudentEnrollments } from '@services/enrollmentService';

const OWNED_PAGE_SIZE = 50;
const MAX_OWNED_PAGES = 20;

/** Matrículas que contam como "já comprei": em andamento, concluída ou com prazo vencido. */
const ACQUIRED_ENROLLMENT_STATUSES = new Set<EnrollmentStatus>([
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
]);

/** Ids dos cursos que o aluno já adquiriu, lendo todas as páginas de matrículas. */
export const loadOwnedCourseIds = async (): Promise<Set<string>> => {
  const ids = new Set<string>();
  let page = 0;
  let totalPages = 1;

  do {
    const result = await getStudentEnrollments({ page, size: OWNED_PAGE_SIZE });
    result.content.forEach((enrollment) => {
      if (ACQUIRED_ENROLLMENT_STATUSES.has(enrollment.enrollmentStatus)) {
        ids.add(enrollment.courseId);
      }
    });
    totalPages = result.totalPages;
    page += 1;
  } while (page < totalPages && page < MAX_OWNED_PAGES);

  return ids;
};
