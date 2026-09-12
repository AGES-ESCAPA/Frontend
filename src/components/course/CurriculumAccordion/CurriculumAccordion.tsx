import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, type FC } from 'react';
import type { CourseModule } from '@/types/course';
import { LessonItem } from '@components/course/LessonItem/LessonItem';
import styles from './CurriculumAccordion.module.css';

export interface CurriculumAccordionProps {
  modules: CourseModule[];
}

export const CurriculumAccordion: FC<CurriculumAccordionProps> = ({ modules }) => {
  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(modules.length > 0 ? [modules[0].id] : []),
  );

  const toggleModule = (moduleId: string) => {
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <div className={styles.accordion}>
      {modules.map((courseModule) => {
        const isOpen = openModules.has(courseModule.id);
        const panelId = `module-${courseModule.id}`;

        return (
          <section className={styles.module} key={courseModule.id}>
            <button
              type="button"
              className={styles.moduleButton}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleModule(courseModule.id)}
            >
              {isOpen ? (
                <ChevronDown size={18} aria-hidden="true" />
              ) : (
                <ChevronRight size={18} aria-hidden="true" />
              )}
              <strong>{courseModule.title}</strong>
              <span>
                {courseModule.lessonCount} aulas · {courseModule.totalMinutes}min
              </span>
            </button>
            {isOpen && courseModule.lessons.length > 0 && (
              <ul id={panelId} className={styles.lessons}>
                {courseModule.lessons.map((lesson) => (
                  <LessonItem key={lesson.id} lesson={lesson} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};
