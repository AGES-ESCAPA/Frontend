import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Lock } from 'lucide-react';
import { LessonNavItem, type LessonStatus } from '../LessonNavItem';
import styles from './ModuleNavSection.module.css';

export interface ModuleNavLesson {
  id: string;
  title: string;
  durationMinutes: number;
  status: LessonStatus;
}

export interface ModuleNavSectionProps {
  moduleId: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  locked: boolean;
  lessons: ModuleNavLesson[];
  currentLessonId?: string;
  buildLessonHref: (lessonId: string) => string;
}

const LOCK_ICON_SIZE = 14;
const CHEVRON_SIZE = 18;

/**
 * Seção expansível de um módulo no menu lateral da Sala de Aula (US-13).
 * É um `Accordion.Item`: o `Accordion.Root` fica no menu que agrupa os módulos.
 */
export const ModuleNavSection = ({
  moduleId,
  title,
  completedLessons,
  totalLessons,
  locked,
  lessons,
  currentLessonId,
  buildLessonHref,
}: ModuleNavSectionProps) => (
  <Accordion.Item value={moduleId} className={`${styles.module} ${locked ? styles.locked : ''}`}>
    <Accordion.Header className={styles.header}>
      <Accordion.Trigger className={styles.trigger}>
        <span className={styles.heading}>
          <span className={styles.title}>
            {locked && (
              <Lock
                className={styles.lockIcon}
                size={LOCK_ICON_SIZE}
                aria-label="Módulo bloqueado"
              />
            )}
            {title}
          </span>
          <span className={styles.counter}>
            {completedLessons}/{totalLessons} concluídas
          </span>
        </span>
        <ChevronDown className={styles.chevron} size={CHEVRON_SIZE} aria-hidden="true" />
      </Accordion.Trigger>
    </Accordion.Header>

    <Accordion.Content className={styles.content}>
      <ul className={styles.lessons}>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <LessonNavItem
              title={lesson.title}
              durationMinutes={lesson.durationMinutes}
              // Em módulo bloqueado o aluno vê o que vem pela frente, mas não navega.
              status={locked ? 'LOCKED' : lesson.status}
              isCurrent={lesson.id === currentLessonId}
              href={buildLessonHref(lesson.id)}
            />
          </li>
        ))}
      </ul>
    </Accordion.Content>
  </Accordion.Item>
);
