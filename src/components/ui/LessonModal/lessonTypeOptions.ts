import type { LucideIcon } from 'lucide-react';
import { CirclePlay, FileText, Link2 } from 'lucide-react';
import type { LessonType } from '@/types/lesson';

export interface LessonTypeOption {
  value: LessonType;
  label: string;
  icon: LucideIcon;
}

export const LESSON_TYPE_OPTIONS: LessonTypeOption[] = [
  { value: 'video', label: 'Vídeo', icon: CirclePlay },
  { value: 'text', label: 'Texto', icon: FileText },
  { value: 'file', label: 'Arquivo', icon: Link2 },
];

export const getLessonTypeIcon = (type: LessonType): LucideIcon =>
  LESSON_TYPE_OPTIONS.find((option) => option.value === type)?.icon ?? CirclePlay;
