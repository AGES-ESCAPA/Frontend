import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { SelectInput } from '../SelectInput';
import type { SelectInputOption } from '../SelectInput';
import { Button } from '../Button';
import styles from './TableFilter.module.css';

export interface TableFilterSelectField {
  id: string;
  label: string;
  value: string;
  options: readonly SelectInputOption[];
  onChange: (value: string) => void;
}

export interface TableFilterPeriodValue {
  startDate: string;
  endDate: string;
}

export interface TableFilterPeriodField {
  label: string;
  /** Rótulo do grupo acessível do painel de datas. */
  groupLabel?: string;
  startLabel?: string;
  endLabel?: string;
  /** Texto do gatilho quando não há datas. */
  emptySummary?: string;
  value: TableFilterPeriodValue;
  onChange: (value: TableFilterPeriodValue) => void;
}

export interface TableFilterProps {
  selects: readonly TableFilterSelectField[];
  period?: TableFilterPeriodField;
  className?: string;
  showClearButton?: boolean;
  clearLabel?: string;
  onClear?: () => void;
}

const PERIOD_ERROR = 'A data inicial não pode ser posterior à data final.';
const DEFAULT_EMPTY_SUMMARY = 'Todos';
const DEFAULT_START_LABEL = 'Data inicial';
const DEFAULT_END_LABEL = 'Data final';
const DEFAULT_CLEAR_LABEL = 'Limpar filtros';

const formatShortDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year.slice(2)}`;
};

const getPeriodSummary = (startDate: string, endDate: string, emptySummary: string): string => {
  if (startDate && endDate) return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
  if (startDate) return `A partir de ${formatShortDate(startDate)}`;
  if (endDate) return `Até ${formatShortDate(endDate)}`;
  return emptySummary;
};

export const TableFilter = ({
  selects,
  period,
  className = '',
  showClearButton = true,
  clearLabel = DEFAULT_CLEAR_LABEL,
  onClear,
}: TableFilterProps) => {
  const startDate = period?.value.startDate ?? '';
  const endDate = period?.value.endDate ?? '';
  const [draft, setDraft] = useState({ startDate, endDate });
  const [error, setError] = useState<string | null>(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const errorId = useId();
  const periodRef = useRef<HTMLDivElement>(null);
  const periodTriggerRef = useRef<HTMLButtonElement>(null);
  const periodPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft({ startDate, endDate });
    setError(null);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isPeriodOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!periodRef.current?.contains(target) && !periodPanelRef.current?.contains(target)) {
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

  useLayoutEffect(() => {
    if (!isPeriodOpen) return undefined;

    const positionPanel = () => {
      const trigger = periodTriggerRef.current;
      const panel = periodPanelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportPadding = 16;
      const width = Math.min(
        Math.max(triggerRect.width, 320),
        window.innerWidth - viewportPadding * 2,
      );
      const left = Math.min(
        Math.max(triggerRect.left, viewportPadding),
        window.innerWidth - width - viewportPadding,
      );
      const panelHeight = panel.getBoundingClientRect().height;
      const below = window.innerHeight - triggerRect.bottom - viewportPadding;
      const above = triggerRect.top - viewportPadding;
      const top =
        below >= panelHeight + 8 || below >= above
          ? Math.min(triggerRect.bottom + 8, window.innerHeight - panelHeight - viewportPadding)
          : triggerRect.top - panelHeight - 8;

      panel.style.left = `${left}px`;
      panel.style.top = `${Math.max(viewportPadding, top)}px`;
      panel.style.width = `${width}px`;
    };

    positionPanel();
    window.addEventListener('resize', positionPanel);
    document.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      document.removeEventListener('scroll', positionPanel, true);
    };
  }, [isPeriodOpen]);

  const handleDate = (field: 'startDate' | 'endDate', date: string) => {
    if (!period) return;

    const next = { ...draft, [field]: date };
    setDraft(next);

    if (next.startDate && next.endDate && next.startDate > next.endDate) {
      setError(PERIOD_ERROR);
      return;
    }
    setError(null);
    period.onChange(next);
  };

  const handleClear = () => {
    setDraft({ startDate: '', endDate: '' });
    setError(null);
    setIsPeriodOpen(false);
    onClear?.();
  };

  const emptySummary = period?.emptySummary ?? DEFAULT_EMPTY_SUMMARY;
  const periodSummary = getPeriodSummary(startDate, endDate, emptySummary);
  const startLabel = period?.startLabel ?? DEFAULT_START_LABEL;
  const endLabel = period?.endLabel ?? DEFAULT_END_LABEL;
  const groupLabel = period?.groupLabel ?? period?.label ?? 'Período';

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.fields}>
        {selects.map((field) => (
          <label key={field.id} className={styles.field}>
            <span className={styles.label}>{field.label}</span>
            <SelectInput
              className={styles.selectControl}
              value={field.value}
              options={field.options}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </label>
        ))}

        {period ? (
          <>
            <div ref={periodRef} className={styles.field} data-invalid={!!error}>
              <span className={styles.label}>{period.label}</span>
              <button
                ref={periodTriggerRef}
                type="button"
                className={styles.periodTrigger}
                aria-label={period.label}
                aria-haspopup="true"
                aria-expanded={isPeriodOpen}
                title={periodSummary}
                onClick={() => setIsPeriodOpen((open) => !open)}
              >
                <span className={styles.periodValue}>{periodSummary}</span>
                <ChevronDown className={styles.chevron} size={24} aria-hidden="true" />
              </button>
            </div>

            {typeof document !== 'undefined'
              ? createPortal(
                  <div
                    ref={periodPanelRef}
                    className={styles.periodPanel}
                    role="group"
                    aria-label={groupLabel}
                    hidden={!isPeriodOpen}
                  >
                    <label className={styles.dateField}>
                      <span className={styles.dateLabel}>{startLabel}</span>
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
                      <span className={styles.dateLabel}>{endLabel}</span>
                      <input
                        type="date"
                        className={styles.date}
                        value={draft.endDate}
                        aria-invalid={!!error}
                        aria-describedby={error ? errorId : undefined}
                        onChange={(e) => handleDate('endDate', e.target.value)}
                      />
                    </label>
                  </div>,
                  document.body,
                )
              : null}
          </>
        ) : null}

        {showClearButton ? (
          <Button
            type="button"
            label={clearLabel}
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
