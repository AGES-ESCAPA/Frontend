import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SelectInput } from '../SelectInput';
import { Button } from '../Button';
import styles from './OrderFilters.module.css';
import {
  ALL_LABEL,
  EMPTY_FILTERS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_TYPE_FILTER_OPTIONS,
} from './OrderFilters.constants';
import type { OrderFiltersValue } from './OrderFilters.constants';

/** Curso disponível para filtragem: apenas o id e o nome que o filtro precisa. */
export interface OrderFilterCourse {
  id: string;
  name: string;
}

export interface OrderFiltersProps {
  value: OrderFiltersValue;
  onChange: (value: OrderFiltersValue) => void;
  courses: OrderFilterCourse[];
  className?: string;
  showClearButton?: boolean;
}

/*seção do calendario*/
const PERIOD_ERROR = 'A data inicial não pode ser posterior à data final.';

const formatShortDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year.slice(2)}`;
};

const getPeriodSummary = (startDate: string, endDate: string): string => {
  if (startDate && endDate) return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
  if (startDate) return `A partir de ${formatShortDate(startDate)}`;
  if (endDate) return `Até ${formatShortDate(endDate)}`;
  return ALL_LABEL;
};

export const OrderFilters = ({
  value,
  onChange,
  courses,
  className = '',
  showClearButton = true,
}: OrderFiltersProps) => {
  const [draft, setDraft] = useState({ startDate: value.startDate, endDate: value.endDate });
  const [error, setError] = useState<string | null>(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const errorId = useId();
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft({ startDate: value.startDate, endDate: value.endDate });
    setError(null);
  }, [value.startDate, value.endDate]);

  useEffect(() => {
    if (!isPeriodOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPeriodOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPeriodOpen]);

  const courseOptions = courses.map((course) => ({ value: course.id, label: course.name }));

  const handleDate = (field: 'startDate' | 'endDate', date: string) => {
    const next = { ...draft, [field]: date };
    setDraft(next);

    if (next.startDate && next.endDate && next.startDate > next.endDate) {
      setError(PERIOD_ERROR);
      return;
    }
    setError(null);
    onChange({ ...value, ...next });
  };

  const handleClear = () => {
    setDraft({ startDate: '', endDate: '' });
    setError(null);
    setIsPeriodOpen(false);
    onChange(EMPTY_FILTERS);
  };

  const periodSummary = getPeriodSummary(value.startDate, value.endDate);

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Tipo</span>
          <SelectInput
            className={styles.selectControl}
            value={value.type}
            options={ORDER_TYPE_FILTER_OPTIONS}
            placeholder={ALL_LABEL}
            onChange={(e) => {
              const selected = ORDER_TYPE_FILTER_OPTIONS.find(
                (option) => option.value === e.target.value,
              );
              if (selected) onChange({ ...value, type: selected.value });
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Status</span>
          <SelectInput
            className={styles.selectControl}
            value={value.status}
            options={ORDER_STATUS_FILTER_OPTIONS}
            placeholder={ALL_LABEL}
            onChange={(e) => {
              const selected = ORDER_STATUS_FILTER_OPTIONS.find(
                (option) => option.value === e.target.value,
              );
              if (selected) onChange({ ...value, status: selected.value });
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Curso</span>
          <SelectInput
            className={styles.selectControl}
            value={value.courseId}
            options={courseOptions}
            placeholder={ALL_LABEL}
            onChange={(e) => onChange({ ...value, courseId: e.target.value })}
          />
        </label>

        <div ref={periodRef} className={styles.field} data-invalid={!!error}>
          <span className={styles.label}>Período</span>
          <button
            type="button"
            className={styles.periodTrigger}
            aria-label="Período"
            aria-haspopup="true"
            aria-expanded={isPeriodOpen}
            title={periodSummary}
            onClick={() => setIsPeriodOpen((open) => !open)}
          >
            <span className={styles.periodValue}>{periodSummary}</span>
            <ChevronDown className={styles.chevron} size={24} aria-hidden="true" />
          </button>

          <div
            className={styles.periodPanel}
            role="group"
            aria-label="Período da compra"
            hidden={!isPeriodOpen}
          >
            <label className={styles.dateField}>
              <span className={styles.dateLabel}>Data inicial</span>
              <input
                type="date"
                className={styles.date}
                value={draft.startDate}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                onChange={(e) => handleDate('startDate', e.target.value)}
              />
            </label>
            <label className={styles.dateField}>
              <span className={styles.dateLabel}>Data final</span>
              <input
                type="date"
                className={styles.date}
                value={draft.endDate}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                onChange={(e) => handleDate('endDate', e.target.value)}
              />
            </label>
          </div>
        </div>

        {showClearButton ? (
          <Button
            type="button"
            label="Limpar filtros"
            variant="secondary"
            className={styles.clearButton}
            onClick={handleClear}
          />
        ) : null}
      </div>

      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};
