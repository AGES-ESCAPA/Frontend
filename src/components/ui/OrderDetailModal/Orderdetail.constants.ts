import type { BadgeVariant } from '../Badge';
import type { OrderStatus, OrderType } from '../OrderFilters';
import { Barcode, CreditCard, QrCode } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CorporateOrderKind = 'course' | 'seats';
export type PaymentMethod = 'CARD' | 'PIX' | 'BOLETO';

export type OrderHistoryEntry = {
  status: OrderStatus;
  date: string;
  description: string;
};

export type OrderRow = {
  id: string;
  code: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;

  clientDocument: string;
  organizationName?: string;
  type: OrderType;

  /*pedidos corporativos: compra de curso ou de assentos. */
  corporateKind?: CorporateOrderKind;
  courseId: string;
  courseName: string;
  seats: number;
  paymentMethod: PaymentMethod;

  /*  cartão */
  installments?: number;
  total: number;
  createdAt: string;
  status: OrderStatus;
  statusHistory: OrderHistoryEntry[];
};

export type OrderAction = Exclude<OrderStatus, 'APPROVED'>;

export const STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  APPROVED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'warning',
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: 'Cartão de Crédito',
  PIX: 'PIX',
  BOLETO: 'Boleto',
};

export const PAYMENT_ICONS: Record<PaymentMethod, LucideIcon> = {
  PIX: QrCode,
  BOLETO: Barcode,
  CARD: CreditCard,
};

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatDateTime = (value: string): string =>
  `${formatDate(value)} ${formatTime(value)}`;
