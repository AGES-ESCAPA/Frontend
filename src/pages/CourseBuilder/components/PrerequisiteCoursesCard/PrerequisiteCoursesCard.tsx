import { useMemo, useState } from 'react';
import { Search, Workflow, X } from 'lucide-react';
import { Panel } from '@components/ui';
import type { CoursePrerequisiteOption } from '@/types/course';
import styles from './PrerequisiteCoursesCard.module.css';

export interface PrerequisiteCoursesCardProps {
  selected: CoursePrerequisiteOption[];
  /** Catálogo disponível para busca — mockado até existir um endpoint de cursos publicados. */
  options: CoursePrerequisiteOption[];
  disabled?: boolean;
  onAdd: (course: CoursePrerequisiteOption) => void;
  onRemove: (courseId: string) => void;
}

export const PrerequisiteCoursesCard = ({
  selected,
  options,
  disabled = false,
  onAdd,
  onRemove,
}: PrerequisiteCoursesCardProps) => {
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const selectedIds = new Set(selected.map((course) => course.id));

    return options.filter(
      (course) =>
        !selectedIds.has(course.id) && course.title.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query, selected]);

  const handleAdd = (course: CoursePrerequisiteOption) => {
    onAdd(course);
    setQuery('');
  };

  return (
    <Panel title="Cursos Pré-requisitos" icon={<Workflow size={22} />}>
      <p className={styles.description}>
        Selecione cursos que o aluno deve concluir antes de se matricular neste.
      </p>

      <div className={styles.field}>
        {selected.length > 0 ? (
          <ul className={styles.chipList}>
            {selected.map((course) => (
              <li key={course.id} className={styles.chip}>
                <span>{course.title}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  disabled={disabled}
                  aria-label={`Remover ${course.title} dos pré-requisitos`}
                  onClick={() => onRemove(course.id)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.searchRow}>
          <Search className={styles.searchIcon} size={18} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar cursos para adicionar..."
            value={query}
            disabled={disabled}
            aria-label="Buscar cursos para adicionar como pré-requisito"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {suggestions.length > 0 ? (
          <ul className={styles.suggestions} role="listbox">
            {suggestions.map((course) => (
              <li key={course.id}>
                <button type="button" onClick={() => handleAdd(course)}>
                  {course.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
};
