import type {
  OrderHistoryEntry,
  OrderRow,
} from '@components/ui/OrderDetailModal/OrderDetailModal.constants';
import type { OrderStatus } from '@components/ui/OrderFilters';

export type OrderManagementAction = 'cancel' | 'refund';

export interface EnrollmentAccess {
  isGranted: boolean;
  progressPercent: number;
}

export interface OrderActionResult {
  order: OrderRow;
  enrollmentAccess: EnrollmentAccess;
}

export interface OrderManagementService {
  listOrders: () => OrderRow[];
  executeAction: (
    orderId: string,
    action: OrderManagementAction,
    expectedStatus: OrderStatus,
  ) => OrderActionResult;
}

export interface OrderCancellationMockOptions {
  enrollmentProgress?: Record<string, number>;
  occupiedCorporateSeats?: Record<string, number>;
  now?: () => Date;
}

export class OrderActionError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'OrderActionError';
  }
}

export const createOrderCancellationMockService = (
  initialOrders: OrderRow[],
  {
    enrollmentProgress = {},
    occupiedCorporateSeats = {},
    now = () => new Date(),
  }: OrderCancellationMockOptions = {},
) => {
  const orders = new Map(initialOrders.map((order) => [order.id, order]));
  const accesses = new Map<string, EnrollmentAccess>(
    initialOrders.map((order) => [
      order.id,
      {
        isGranted: order.status === 'APPROVED',
        progressPercent: enrollmentProgress[order.id] ?? 0,
      },
    ]),
  );

  return {
    listOrders: () => Array.from(orders.values()),

    getEnrollmentAccess: (orderId: string): EnrollmentAccess => {
      const access = accesses.get(orderId);
      if (!access) {
        throw new OrderActionError(404, 'O acesso deste pedido não foi encontrado.');
      }
      return { ...access };
    },

    executeAction: (
      orderId: string,
      action: OrderManagementAction,
      expectedStatus: OrderStatus,
    ): OrderActionResult => {
      const order = orders.get(orderId);
      if (!order) {
        throw new OrderActionError(404, 'O pedido não foi encontrado.');
      }

      if (order.status !== expectedStatus) {
        throw new OrderActionError(
          409,
          'O pedido foi atualizado por outra ação. A lista foi sincronizada; confira o status antes de tentar novamente.',
        );
      }

      const requiredStatus = action === 'cancel' ? 'APPROVED' : 'CANCELLED';
      if (order.status !== requiredStatus) {
        throw new OrderActionError(
          409,
          action === 'cancel'
            ? 'Somente pedidos aprovados podem ser cancelados.'
            : 'Somente pedidos cancelados podem receber o registro de reembolso.',
        );
      }

      if (action === 'cancel' && order.corporateKind === 'seats') {
        const occupiedSeats = occupiedCorporateSeats[order.id] ?? 0;
        if (occupiedSeats > 0) {
          throw new OrderActionError(
            409,
            `Não é possível cancelar este pedido: ${occupiedSeats} de ${order.seats} assentos estão em uso. Libere os assentos antes de tentar novamente.`,
          );
        }
      }

      const nextStatus = action === 'cancel' ? 'CANCELLED' : 'REFUNDED';
      const actionDate = now().toISOString();
      const historyEntry: OrderHistoryEntry = {
        status: nextStatus,
        date: actionDate,
        description:
          action === 'cancel'
            ? 'Pedido cancelado pelo administrador. Acesso revogado; progresso preservado.'
            : 'Reembolso registrado pelo administrador.',
      };
      const updatedOrder: OrderRow = {
        ...order,
        status: nextStatus,
        statusHistory: [...order.statusHistory, historyEntry],
      };
      const currentAccess = accesses.get(orderId);
      if (!currentAccess) {
        throw new OrderActionError(404, 'O acesso deste pedido não foi encontrado.');
      }

      const updatedAccess: EnrollmentAccess =
        action === 'cancel' ? { ...currentAccess, isGranted: false } : currentAccess;

      orders.set(orderId, updatedOrder);
      accesses.set(orderId, updatedAccess);

      return {
        order: updatedOrder,
        enrollmentAccess: { ...updatedAccess },
      };
    },
  };
};
