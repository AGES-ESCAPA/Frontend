import type { CourseCardProps, CourseLevel } from '@components/ui/CourseCard/CourseCard';
import type { BadgeCategory } from '@components/ui/Badge/Badge';
import type { PublicCourseCard } from '@/types/course';
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
