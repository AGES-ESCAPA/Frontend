export type LessonType = 'video' | 'text' | 'quiz';

export interface CourseLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  isFree?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  lessonCount: number;
  totalMinutes: number;
  lessons: CourseLesson[];
}

/** Cartão de curso retornado por GET /api/v1/public/courses. */
export interface PublicCourseCard {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  level: string;
  /** Carga horária em minutos. */
  durationTime: number | null;
  lessonsCount: number | null;
  price: number | null;
  thumbnailUrl: string | null;
  instructor: string | null;
  ratingAverage: number | null;
  reviewsCount: number | null;
}

/** Envelope paginado da listagem pública de cursos. */
export interface PublicCoursesPage {
  content: PublicCourseCard[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

/** Query params aceitos por GET /api/v1/public/courses. */
export interface PublicCoursesQuery {
  title?: string;
  category?: string;
  level?: string;
  page?: number;
  size?: number;
}

export interface CourseSummary {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  accessPeriod: string;
  price: string;
  instructor: {
    name: string;
    role: string;
  };
  benefits: string[];
  teaserUrl: string;
  modules: CourseModule[];
}
