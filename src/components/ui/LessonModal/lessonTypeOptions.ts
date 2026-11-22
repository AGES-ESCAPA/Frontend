import type { LucideIcon } from 'lucide-react';
import { CircleHelp, CirclePlay, FileText } from 'lucide-react';
import type { LessonType } from '@/types/lesson';

export interface LessonTypeOption {
  value: LessonType;
  label: string;
  icon: LucideIcon;
}

/** Tipos oferecidos na criação/edição. `file` ficou de fora de propósito. */
export const LESSON_TYPE_OPTIONS: LessonTypeOption[] = [
  { value: 'video', label: 'Vídeo', icon: CirclePlay },
  { value: 'text', label: 'Texto', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: CircleHelp },
];

export const getLessonTypeIcon = (type: LessonType): LucideIcon =>
  LESSON_TYPE_OPTIONS.find((option) => option.value === type)?.icon ??
  (type === 'file' ? FileText : CirclePlay);
