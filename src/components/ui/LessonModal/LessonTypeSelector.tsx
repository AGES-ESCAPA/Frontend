import type { LessonType } from '@/types/lesson';
import { LESSON_TYPE_OPTIONS } from './lessonTypeOptions';
import styles from './LessonModal.module.css';

export interface LessonTypeSelectorProps {
  /** Nome do grupo de rádios, necessário para isolar múltiplos modais na tela. */
  name: string;
  labelId: string;
  value: LessonType;
  onChange: (type: LessonType) => void;
}

export const LessonTypeSelector = ({ name, labelId, value, onChange }: LessonTypeSelectorProps) => (
  <div className={styles.field}>
    <span className={styles.label} id={labelId}>
      Tipo de aula
      <span className={styles.required} aria-hidden="true">
        *
      </span>
    </span>

    <div className={styles.typeGrid} role="radiogroup" aria-labelledby={labelId}>
      {LESSON_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = option.value === value;

        return (
          <label
            key={option.value}
            className={`${styles.typeOption} ${isSelected ? styles.typeOptionSelected : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className={styles.srOnly}
            />
            <span className={styles.typeIcon}>
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className={styles.typeLabel}>{option.label}</span>
          </label>
        );
      })}
    </div>
  </div>
);
