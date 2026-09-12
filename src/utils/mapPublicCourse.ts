import type { CourseCardProps, CourseLevel } from '@components/ui/CourseCard/CourseCard';
import type { BadgeCategory } from '@components/ui/Badge/Badge';
import type {
  CourseLesson,
  CourseModule,
  CourseSummary,
  LessonType,
  PublicCourseCard,
  PublicCourseContent,
  PublicCourseDetails,
  PublicCourseModuleDetails,
} from '@/types/course';
import { formatCurrency, formatWorkload } from './formatters';

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const CATEGORY_MAP: Record<string, BadgeCategory> = {
  'inteligencia artificial': 'ai',
  ia: 'ai',
  marketing: 'marketing',
  hospitalidade: 'hospitality',
  turismo: 'tourism',
  inovacao: 'innovation',
};

const LEVEL_MAP: Record<string, CourseLevel> = {
  iniciante: 'basic',
  basico: 'basic',
  basic: 'basic',
  intermediario: 'intermediate',
  intermediate: 'intermediate',
  avancado: 'advanced',
  advanced: 'advanced',
};

const API_LEVEL_MAP: Record<string, string> = {
  iniciante: 'INICIANTE',
  basic: 'INICIANTE',
  intermediario: 'INTERMEDIARIO',
  intermediate: 'INTERMEDIARIO',
  avancado: 'AVANCADO',
  advanced: 'AVANCADO',
};

export const mapCourseCategory = (category: string): BadgeCategory =>
  CATEGORY_MAP[normalize(category)] ?? category;

export const mapCourseLevel = (level: string): CourseLevel =>
  LEVEL_MAP[normalize(level)] ?? 'basic';

export const toApiLevel = (level: string): string => API_LEVEL_MAP[normalize(level)] ?? level;

const LEVEL_LABEL_MAP: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const toDisplayLevel = (level: string): string => LEVEL_LABEL_MAP[normalize(level)] ?? level;

const mapLessonType = (type: string): LessonType => {
  const key = normalize(type);
  if (key.includes('quiz')) return 'quiz';
  if (key.includes('text') || key.includes('texto')) return 'text';
  return 'video';
};

const mapPublicContentToLesson = (content: PublicCourseContent): CourseLesson => ({
  id: content.id,
  title: content.title,
  type: mapLessonType(content.type),
  durationMinutes: content.durationMinutes ?? 0,
  isFree: content.isFree ?? false,
});

const mapPublicModule = (module: PublicCourseModuleDetails): CourseModule => ({
  id: module.id,
  title: module.title,
  lessonCount: module.totalContents,
  totalMinutes: module.durationMinutes ?? 0,
  lessons: module.contents.map(mapPublicContentToLesson),
});

const firstTeaserUrl = (course: PublicCourseDetails): string => {
  const contents = course.modules?.flatMap((module) => module.contents) ?? [];
  const freeVideo = contents.find(
    (content) => content.isFree && content.url && mapLessonType(content.type) === 'video',
  );

  return freeVideo?.url ?? contents.find((content) => content.url)?.url ?? '';
};

export const mapPublicCourseDetailsToSummary = (course: PublicCourseDetails): CourseSummary => ({
  id: course.id,
  title: course.title,
  thumbnailUrl: course.thumbnailUrl,
  category: course.category ?? 'Curso',
  level: toDisplayLevel(course.level ?? ''),
  description: course.description ?? course.shortDescription ?? '',
  rating: course.rating ?? 0,
  reviewsCount: course.reviewsCount ?? 0,
  studentsCount: course.studentsCount ?? 0,
  durationHours: Math.floor((course.durationTime ?? 0) / 60),
  accessPeriod: course.deadline ? `${course.deadline} dias de acesso` : 'Acesso vitalício',
  price: formatCurrency(course.price ?? 0),
  instructor: {
    name: course.instructor?.name ?? 'ESCAPA',
    role: course.instructor?.headline ?? '',
  },
  benefits: course.learningObjectives ?? [],
  teaserUrl: firstTeaserUrl(course),
  materials: course.materials ?? [],
  modules: (course.modules ?? []).map(mapPublicModule),
});

export const mapPublicCourseToCardProps = (
  course: PublicCourseCard,
  onClick: (id: string) => void,
): CourseCardProps => ({
  id: course.id,
  imageUrl: course.thumbnailUrl ?? '',
  category: mapCourseCategory(course.category),
  level: mapCourseLevel(course.level),
  title: course.title,
  description: course.shortDescription,
  rating: course.ratingAverage ?? undefined,
  reviewsCount: course.reviewsCount ?? undefined,
  duration: formatWorkload(course.durationTime),
  lessonsCount: course.lessonsCount ?? 0,
  instructor: course.instructor ?? 'ESCAPA',
  price: formatCurrency(course.price ?? 0),
  onClick,
});
