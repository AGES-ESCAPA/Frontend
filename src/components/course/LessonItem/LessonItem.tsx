import { CircleHelp, FileText, LockKeyhole, Play } from 'lucide-react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalAuth } from '@contexts/useAuth';
import type { CourseLesson } from '@/types/course';
import { authPath } from '@utils/authReturnTo';
import styles from './LessonItem.module.css';

export interface LessonItemProps {
  courseId: string;
  lesson: CourseLesson;
}

const icons = {
  video: Play,
  text: FileText,
  quiz: CircleHelp,
} as const;

export const LessonItem: FC<LessonItemProps> = ({ courseId, lesson }) => {
  const Icon = icons[lesson.type];
  const auth = useOptionalAuth();
  const isLearner = auth?.user?.role === 'STUDENT' || auth?.user?.role === 'EMPLOYEE';
  const freeLessonPath = `/aluno/cursos/${courseId}/aulas/${lesson.id}`;
  const freeHref =
    lesson.isFree && isLearner
      ? freeLessonPath
      : lesson.isFree && !auth?.isAuthenticated
        ? authPath('/login', freeLessonPath)
        : null;

  const body = (
    <>
      <Icon size={16} aria-hidden="true" />
      <span className={styles.title}>{lesson.title}</span>
      {lesson.isFree ? (
        <span className={styles.free}>GRÁTIS</span>
      ) : (
        <LockKeyhole size={14} aria-label="Aula bloqueada" />
      )}
      <span className={styles.duration}>{lesson.durationMinutes}min</span>
    </>
  );

  if (freeHref) {
    return (
      <li className={styles.item}>
        <Link className={styles.link} to={freeHref} state={{ returnTo: freeLessonPath }}>
          {body}
        </Link>
      </li>
    );
  }

  return <li className={styles.item}>{body}</li>;
};
