import type { OrderHistoryEntry, OrderRow } from '@components/ui';
import type { OrderStatus } from '@components/ui';
import type { AdminOrderDetails } from '@/types/order';

/**
 * O backend só devolve o UUID do pedido; deriva um código curto para exibição.
 * Usa os últimos caracteres (não os primeiros) porque os UUIDs de seed compartilham
 * o mesmo prefixo (ex.: `05000000-0000-4000-9000-000000000013`), o que faria vários
 * pedidos mostrarem o mesmo código.
 */
export const toOrderCode = (id: string): string =>
  `PED-${id.replace(/-/g, '').slice(-8).toUpperCase()}`;

const DEFAULT_HISTORY_DESCRIPTIONS: Record<OrderStatus, string> = {
  APPROVED: 'Pagamento aprovado.',
  CANCELLED: 'Pedido cancelado pelo administrador.',
  REFUNDED: 'Reembolso registrado pelo administrador.',
};

const mapHistoryEntry = (
  change: AdminOrderDetails['statusHistory'][number],
): OrderHistoryEntry => ({
  status: change.status,
  date: change.createdAt,
  description: change.reason ?? DEFAULT_HISTORY_DESCRIPTIONS[change.status],
});

/** Converte o detalhe vindo de `GET /api/v1/admin/orders/{id}` para o modelo do `OrderDetailModal`. */
export const mapAdminOrderDetailsToOrderRow = (details: AdminOrderDetails): OrderRow => {
  const isCorporate = details.type === 'CORPORATE';
  const isSeatsPurchase = details.item.type === 'SEATS';

  return {
    id: details.id,
    code: toOrderCode(details.id),
    clientName: details.buyer?.name ?? '',
    clientEmail: details.buyer?.email ?? '',
    clientPhone: details.buyer?.phone ?? '',
    clientDocument: details.buyer?.document ?? '',
    type: details.type,
    ...(isCorporate
      ? { corporateKind: isSeatsPurchase ? ('seats' as const) : ('course' as const) }
      : {}),
    courseId: details.item.courseId ?? '',
    courseName: details.item.courseTitle ?? 'Assentos corporativos',
    seats: details.item.seatsQuantity ?? 1,
    paymentMethod: details.paymentMethod,
    ...(details.installments ? { installments: details.installments } : {}),
    total: details.amount,
    createdAt: details.createdAt,
    status: details.status,
    statusHistory: details.statusHistory.map(mapHistoryEntry),
  };
};
