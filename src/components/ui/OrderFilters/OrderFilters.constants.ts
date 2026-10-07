export type OrderType = 'Todos' | 'individual' | 'corporate';
export type OrderStatus = 'Todos' | 'Aprovado' | 'Cancelado' | 'Reembolsado';

export interface OrderFiltersValue {
  type: OrderType;
  courseId: string;
  startDate: string;
  endDate: string;
  status: OrderStatus;
}

export const EMPTY_FILTERS: OrderFiltersValue = {
  type: 'Todos',
  courseId: 'Todos',
  startDate: '',
  endDate: '',
  status: 'Todos',
};
