import { memo } from 'react';
import { Shapes } from 'lucide-react';
import { Button, FormField, Panel, SelectInput } from '@components/ui';
import type { SelectInputOption } from '@components/ui';
import { COURSE_CATEGORIES, COURSE_DIFFICULTIES } from '@/types/course';
import type { CourseFormField } from '@/types/course';
import styles from './ClassificationCard.module.css';

export interface ClassificationCardProps {
  category: string;
  difficulty: string;
  categoryError?: string;
  difficultyError?: string;
  disabled?: boolean;
  onFieldChange: (field: CourseFormField, value: string) => void;
}

const CATEGORY_ID = 'course-category';

const CATEGORY_OPTIONS: readonly SelectInputOption[] = COURSE_CATEGORIES.map((category) => ({
  value: category,
  label: category,
}));

const ClassificationCardBase = ({
  category,
  difficulty,
  categoryError,
  difficultyError,
  disabled = false,
  onFieldChange,
}: ClassificationCardProps) => (
  <Panel title="Classificação" icon={<Shapes size={22} />}>
    <FormField label="Categoria Principal" htmlFor={CATEGORY_ID} required error={categoryError}>
      <SelectInput
        id={CATEGORY_ID}
        value={category}
        options={CATEGORY_OPTIONS}
        placeholder="Selecione uma categoria"
        required
        disabled={disabled}
        invalid={categoryError !== undefined}
        onChange={(event) => onFieldChange('category', event.target.value)}
      />
    </FormField>

    <FormField label="Nível de Dificuldade" required error={difficultyError}>
      <div className={styles.levelGroup} role="group" aria-label="Nível de dificuldade do curso">
        {COURSE_DIFFICULTIES.map((option) => (
          <Button
            key={option.value}
            type="button"
            label={option.label}
            variant={difficulty === option.value ? 'active' : 'secondary'}
            className={styles.levelButton}
            aria-pressed={difficulty === option.value}
            disabled={disabled}
            onClick={() => onFieldChange('difficulty', option.value)}
          />
        ))}
      </div>
    </FormField>
  </Panel>
);

export const ClassificationCard = memo(ClassificationCardBase);
