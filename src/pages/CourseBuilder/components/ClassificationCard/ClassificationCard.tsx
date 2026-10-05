import { memo } from 'react';
import { Shapes } from 'lucide-react';
import { Button, FormField, Panel } from '@components/ui';
import { COURSE_DIFFICULTIES } from '@/types/course';
import type { CourseFormField } from '@/types/course';
import { CategoryCombobox } from './CategoryCombobox';
import styles from './ClassificationCard.module.css';

export interface ClassificationCardProps {
  category: string;
  difficulty: string;
  categoryError?: string;
  difficultyError?: string;
  categories: readonly string[];
  isCategoriesLoading?: boolean;
  disabled?: boolean;
  onFieldChange: (field: CourseFormField, value: string) => void;
}

const CATEGORY_ID = 'course-category';

const ClassificationCardBase = ({
  category,
  difficulty,
  categoryError,
  difficultyError,
  categories,
  isCategoriesLoading = false,
  disabled = false,
  onFieldChange,
}: ClassificationCardProps) => (
  <Panel title="Classificação" icon={<Shapes size={22} />} className={styles.panel}>
    <FormField label="Categoria Principal" htmlFor={CATEGORY_ID} required error={categoryError}>
      <CategoryCombobox
        id={CATEGORY_ID}
        value={category}
        categories={categories}
        isLoading={isCategoriesLoading}
        placeholder="Selecione uma categoria"
        required
        disabled={disabled}
        invalid={categoryError !== undefined}
        onChange={(nextCategory) => onFieldChange('category', nextCategory)}
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
