export const ORDER_STATUSES = ['Approved', 'Cancelled', 'Refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TYPES = ['individual', 'corporate'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/*Dicionario para que apareceça para o usuario em PT mais o back entenda em EN*/
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Approved: 'Aprovado',
  Cancelled: 'Cancelado',
  Refunded: 'Reembolsado',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  individual: 'Individual',
  corporate: 'Corporativo',
};

export type OrderTypeFilter = 'all' | OrderType;
export type OrderStatusFilter = 'all' | OrderStatus;

export const ALL_LABEL = 'Todos';

export const ORDER_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: ALL_LABEL },
  ...ORDER_TYPES.map((type) => ({ value: type, label: ORDER_TYPE_LABELS[type] })),
] as const;

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: ALL_LABEL },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
] as const;

/*   courseId: 'all' é um valor em strings*/
export interface OrderFiltersValue {
  type: OrderTypeFilter;
  courseId: string;
  startDate: string;
  endDate: string;
  status: OrderStatusFilter;
}

export const EMPTY_FILTERS: OrderFiltersValue = {
  type: 'all',
  courseId: 'all',
  startDate: '',
  endDate: '',
  status: 'all',
};
