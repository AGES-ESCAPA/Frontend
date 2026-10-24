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
  /** Data da compra no formato `yyyy-MM-dd` (LocalDate do backend). */
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

const SAO_PAULO_TZ = 'America/Sao_Paulo';

/** Data e hora de um instante (timestamp ISO com fuso) no horário de São Paulo. */
export const formatDateTime = (timestamp: string): string => {
  const instant = new Date(timestamp);
  const date = instant.toLocaleDateString('pt-BR', { timeZone: SAO_PAULO_TZ });
  const time = instant.toLocaleTimeString('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date} ${time}`;
};
