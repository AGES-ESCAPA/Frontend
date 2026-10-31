import { Search, Workflow, X } from 'lucide-react';
import { Panel } from '@components/ui';
import type { CoursePrerequisiteOption } from '@/types/course';
import styles from './PrerequisiteCoursesCard.module.css';

export interface PrerequisiteCoursesCardProps {
  selected: CoursePrerequisiteOption[];
  /** Resultados da busca na API, já sem o próprio curso. */
  suggestions: CoursePrerequisiteOption[];
  query: string;
  /** Mensagem de busca em andamento, lista vazia ou falha. Omitida quando há sugestões. */
  searchStatus?: string | null;
  disabled?: boolean;
  onQueryChange: (query: string) => void;
  onAdd: (course: CoursePrerequisiteOption) => void;
  onRemove: (courseId: string) => void;
}

export const PrerequisiteCoursesCard = ({
  selected,
  suggestions,
  query,
  searchStatus = null,
  disabled = false,
  onQueryChange,
  onAdd,
  onRemove,
}: PrerequisiteCoursesCardProps) => {
  const selectedIds = new Set(selected.map((course) => course.id));
  const visibleSuggestions = suggestions.filter((course) => !selectedIds.has(course.id));

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
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        {searchStatus && visibleSuggestions.length === 0 ? (
          <p className={styles.searchStatus} role="status">
            {searchStatus}
          </p>
        ) : null}

        {visibleSuggestions.length > 0 ? (
          <ul className={styles.suggestions} role="listbox">
            {visibleSuggestions.map((course) => (
              <li key={course.id}>
                <button type="button" disabled={disabled} onClick={() => onAdd(course)}>
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
