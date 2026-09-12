import { CircleHelp, FileText, LockKeyhole, Play } from 'lucide-react';
import type { FC } from 'react';
import type { CourseLesson } from '@/types/course';
import styles from './LessonItem.module.css';

export interface LessonItemProps {
  lesson: CourseLesson;
}

const icons = {
  video: Play,
  text: FileText,
  quiz: CircleHelp,
} as const;

export const LessonItem: FC<LessonItemProps> = ({ lesson }) => {
  const Icon = icons[lesson.type];

  return (
    <li className={styles.item}>
      <Icon size={16} aria-hidden="true" />
      <span className={styles.title}>{lesson.title}</span>
      {lesson.isFree ? (
        <span className={styles.free}>GRÁTIS</span>
      ) : (
        <LockKeyhole size={14} aria-label="Aula bloqueada" />
      )}
      <span className={styles.duration}>{lesson.durationMinutes}min</span>
    </li>
  );
};
