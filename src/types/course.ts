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
