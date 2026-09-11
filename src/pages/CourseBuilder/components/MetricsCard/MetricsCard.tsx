import { memo } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { FormField, Panel, TextInput } from '@components/ui';
import type { CourseFormField } from '@/types/course';
import styles from './MetricsCard.module.css';

export interface MetricsCardProps {
  durationTime: string;
  deadline: string;
  price: string;
  durationTimeError?: string;
  deadlineError?: string;
  priceError?: string;
  disabled?: boolean;
  onFieldChange: (field: CourseFormField, value: string) => void;
}

const DURATION_ID = 'course-duration-time';
const DEADLINE_ID = 'course-deadline';
const PRICE_ID = 'course-price';

const MetricsCardBase = ({
  durationTime,
  deadline,
  price,
  durationTimeError,
  deadlineError,
  priceError,
  disabled = false,
  onFieldChange,
}: MetricsCardProps) => (
  <Panel title="Métricas & Comercial" icon={<ChartNoAxesCombined size={22} />}>
    <div className={styles.row}>
      <FormField label="Carga Horária (h)" htmlFor={DURATION_ID} required error={durationTimeError}>
        <TextInput
          id={DURATION_ID}
          value={durationTime}
          inputMode="numeric"
          placeholder="40"
          required
          disabled={disabled}
          invalid={durationTimeError !== undefined}
          onChange={(event) => onFieldChange('durationTime', event.target.value)}
        />
      </FormField>

      <FormField label="Prazo (Dias)" htmlFor={DEADLINE_ID} error={deadlineError}>
        <TextInput
          id={DEADLINE_ID}
          value={deadline}
          inputMode="numeric"
          placeholder="365"
          disabled={disabled}
          invalid={deadlineError !== undefined}
          onChange={(event) => onFieldChange('deadline', event.target.value)}
        />
      </FormField>
    </div>

    <hr className={styles.divider} />

    <FormField
      label="Preço Base (BRL)"
      htmlFor={PRICE_ID}
      required
      error={priceError}
      hint="Aplica-se apenas a contratações avulsas."
    >
      <TextInput
        id={PRICE_ID}
        value={price}
        inputMode="decimal"
        placeholder="499.00"
        addon="R$"
        required
        disabled={disabled}
        invalid={priceError !== undefined}
        onChange={(event) => onFieldChange('price', event.target.value)}
      />
    </FormField>
  </Panel>
);

export const MetricsCard = memo(MetricsCardBase);
