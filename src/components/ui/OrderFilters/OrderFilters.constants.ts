export const ORDER_STATUSES = ['APPROVED', 'CANCELLED', 'REFUNDED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TYPES = ['INDIVIDUAL', 'CORPORATE'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/*Dicionario para que apareça para o usuario em PT mas o back entenda em EN*/
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  APPROVED: 'Aprovado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  INDIVIDUAL: 'Individual',
  CORPORATE: 'Corporativo',
};

/** Texto exibido enquanto o filtro está sem valor. */
export const ALL_LABEL = 'Todos';

export const ORDER_TYPE_FILTER_OPTIONS = ORDER_TYPES.map((type) => ({
  value: type,
  label: ORDER_TYPE_LABELS[type],
}));

export const ORDER_STATUS_FILTER_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status],
}));

/** Cada filtro vazio ('') significa "sem filtro" e não é enviado ao backend. */
export interface OrderFiltersValue {
  type: OrderType | '';
  courseId: string;
  startDate: string;
  endDate: string;
  status: OrderStatus | '';
}

export const EMPTY_FILTERS: OrderFiltersValue = {
  type: '',
  courseId: '',
  startDate: '',
  endDate: '',
  status: '',
};
