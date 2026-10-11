import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { ModuleNavSection, type ModuleNavLesson } from '@components/ui/ModuleNavSection';
import { ProgressBar } from '@components/ui/ProgressBar';
import styles from './CourseNavigationSidebar.module.css';

export interface CourseNavigationModule {
  id: string;
  title: string;
  locked: boolean;
  completedLessons: number;
  totalLessons: number;
  lessons: ModuleNavLesson[];
}

export interface CourseNavigationSidebarProps {
  completedLessons: number;
  totalLessons: number;
  modules: CourseNavigationModule[];
  currentLessonId?: string;
  buildLessonHref: (lessonId: string) => string;
}

const TITLE = 'Conteúdo do curso';
const PROGRESS_LABEL = 'Progresso do curso';
const CHEVRON_SIZE = 18;

const findModuleIdOfLesson = (
  modules: CourseNavigationModule[],
  lessonId: string | undefined,
): string | undefined =>
  lessonId
    ? modules.find((courseModule) => courseModule.lessons.some(({ id }) => id === lessonId))?.id
    : undefined;

/**
 * Menu lateral da Sala de Aula (US-13): progresso geral do curso e a grade de
 * módulos e aulas. O módulo da aula atual abre sozinho; os demais o aluno abre
 * e fecha à vontade.
 */
export const CourseNavigationSidebar = ({
  completedLessons,
  totalLessons,
  modules,
  currentLessonId,
  buildLessonHref,
}: CourseNavigationSidebarProps) => {
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(true);
  const currentModuleId = findModuleIdOfLesson(modules, currentLessonId);
  const [openModules, setOpenModules] = useState<string[]>(() =>
    currentModuleId ? [currentModuleId] : [],
  );

  // Ao navegar para uma aula de outro módulo, abre esse módulo sem fechar os que o aluno abriu.
  useEffect(() => {
    if (!currentModuleId) return;
    setOpenModules((open) => (open.includes(currentModuleId) ? open : [...open, currentModuleId]));
  }, [currentModuleId]);

  const isCourseCompleted = totalLessons > 0 && completedLessons >= totalLessons;

  return (
    <nav className={styles.sidebar} aria-label={TITLE}>
      <h2 className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {TITLE}
          <ChevronDown className={styles.chevron} size={CHEVRON_SIZE} aria-hidden="true" />
        </button>
      </h2>

      {isExpanded && (
        <div id={contentId}>
          <div className={styles.progress}>
            <span className={styles.progressLabel}>{PROGRESS_LABEL}</span>
            {/* Mesmo padrão do progresso no StudentCourseCard. */}
            <div className={styles.progressRow}>
              <ProgressBar
                className={styles.progressBar}
                value={completedLessons}
                max={totalLessons}
                variant={isCourseCompleted ? 'success' : 'default'}
                aria-label={PROGRESS_LABEL}
              />
              <span className={styles.progressCounter}>
                {completedLessons}/{totalLessons}
              </span>
            </div>
          </div>

          <Accordion.Root type="multiple" value={openModules} onValueChange={setOpenModules}>
            {modules.map((courseModule) => (
              <ModuleNavSection
                key={courseModule.id}
                moduleId={courseModule.id}
                title={courseModule.title}
                completedLessons={courseModule.completedLessons}
                totalLessons={courseModule.totalLessons}
                locked={courseModule.locked}
                lessons={courseModule.lessons}
                currentLessonId={currentLessonId}
                buildLessonHref={buildLessonHref}
              />
            ))}
          </Accordion.Root>
        </div>
      )}
    </nav>
  );
};
