import { TableFilter } from '../TableFilter';
import type { TableFilterSelectField } from '../TableFilter';
import styles from './OrderFilters.module.css';
import {
  ALL_LABEL,
  EMPTY_FILTERS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_TYPE_FILTER_OPTIONS,
} from './OrderFilters.constants';
import type { OrderFiltersValue } from './OrderFilters.constants';

/** Curso disponível para filtragem */
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

export const OrderFilters = ({
  value,
  onChange,
  courses,
  className = '',
  showClearButton = true,
}: OrderFiltersProps) => {
  const courseOptions = [
    { value: '', label: ALL_LABEL },
    ...courses.map((course) => ({ value: course.id, label: course.name })),
  ];

  const selects: TableFilterSelectField[] = [
    {
      id: 'type',
      label: 'Tipo',
      value: value.type,
      options: ORDER_TYPE_FILTER_OPTIONS,
      onChange: (type) =>
        onChange({
          ...value,
          type: type as OrderFiltersValue['type'],
        }),
    },
    {
      id: 'status',
      label: 'Status',
      value: value.status,
      options: ORDER_STATUS_FILTER_OPTIONS,
      onChange: (status) =>
        onChange({
          ...value,
          status: status as OrderFiltersValue['status'],
        }),
    },
    {
      id: 'course',
      label: 'Curso',
      value: value.courseId,
      options: courseOptions,
      onChange: (courseId) => onChange({ ...value, courseId }),
    },
  ];

  return (
    <TableFilter
      className={`${styles.root} ${className}`.trim()}
      selects={selects}
      showClearButton={showClearButton}
      onClear={() => onChange(EMPTY_FILTERS)}
      period={{
        label: 'Período',
        groupLabel: 'Período da compra',
        emptySummary: ALL_LABEL,
        value: { startDate: value.startDate, endDate: value.endDate },
        onChange: ({ startDate, endDate }) => onChange({ ...value, startDate, endDate }),
      }}
    />
  );
};
