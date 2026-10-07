import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SelectInput } from '../SelectInput';
import { Button } from '../Button';
import styles from './OrderFilters.module.css';
import { EMPTY_FILTERS } from './OrderFilters.constants';
import type { OrderFiltersValue, OrderType, OrderStatus } from './OrderFilters.constants';

export interface Course {
  id: string;
  name: string;
}

export interface OrderFiltersProps {
  value: OrderFiltersValue;
  onChange: (value: OrderFiltersValue) => void;
  courses: Course[];
}

const TYPE_OPTIONS = [
  { value: 'Todos', label: 'Todos' },
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporativo' },
];

const STATUS_OPTIONS = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Aprovado', label: 'Aprovado' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Reembolsado', label: 'Reembolsado' },
];

const formatShortDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year.slice(2)}`;
};

const getPeriodSummary = (startDate: string, endDate: string): string => {
  if (startDate && endDate) return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
  if (startDate) return `A partir de ${formatShortDate(startDate)}`;
  if (endDate) return `Até ${formatShortDate(endDate)}`;
  return 'Todos';
};

const PERIOD_ERROR = 'A data inicial não pode ser posterior à data final.';

export function OrderFilters({ value, onChange, courses }: OrderFiltersProps) {
  const [draft, setDraft] = useState({ startDate: value.startDate, endDate: value.endDate });
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
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

  const courseOptions = [
    { value: 'Todos', label: 'Todos' },
    ...courses.map((c) => ({ value: c.id, label: c.name })),
  ];

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

  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Tipo</span>
          <SelectInput
            className={styles.selectControl}
            value={value.type}
            options={TYPE_OPTIONS}
            onChange={(e) => onChange({ ...value, type: e.target.value as OrderType })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Status</span>
          <SelectInput
            className={styles.selectControl}
            value={value.status}
            options={STATUS_OPTIONS}
            onChange={(e) => onChange({ ...value, status: e.target.value as OrderStatus })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Curso</span>
          <SelectInput
            className={styles.selectControl}
            value={value.courseId}
            options={courseOptions}
            onChange={(e) => onChange({ ...value, courseId: e.target.value })}
          />
        </label>

        <div
          ref={periodRef}
          className={`${styles.field} ${styles.periodField}`}
          data-invalid={!!error}
        >
          <span className={styles.label}>Período</span>
          <button
            type="button"
            className={styles.periodTrigger}
            aria-label="Período"
            aria-haspopup="true"
            aria-expanded={isPeriodOpen}
            title={getPeriodSummary(draft.startDate, draft.endDate)}
            onClick={() => setIsPeriodOpen((open) => !open)}
          >
            <span className={styles.periodValue}>
              {getPeriodSummary(value.startDate, value.endDate)}
            </span>
            <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
          </button>

          {/* Os campos ficam sempre no DOM (apenas ocultos): o rascunho e a validação
              independem de o painel estar aberto. */}
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

        <Button
          type="button"
          label="Limpar filtros"
          variant="secondary"
          className={styles.clearButton}
          onClick={handleClear}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
