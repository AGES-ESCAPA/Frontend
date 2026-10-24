export type OrderItemType = 'COURSE' | 'SEATS';

export type PaymentMethod = 'CARD' | 'PIX' | 'BOLETO';

export type PlacedOrderStatus = 'APPROVED' | 'CANCELLED' | 'REFUNDED';

/**
 * Corpo de `POST /api/v1/orders`. Não tem valor nem dados de cartão: o valor é calculado no servidor
 * e a API recebe só o que comprar, a forma de pagamento e as parcelas.
 */
export interface CreateOrderPayload {
  itemType: OrderItemType;
  /** Obrigatório em compra de curso. */
  courseId?: string;
  /** Obrigatório em compra de assentos (só empresa). */
  seatsQuantity?: number;
  paymentMethod: 'CARD';
  installments: number;
}

/** Pedido registrado pela API (resposta `201` de `POST /api/v1/orders`). */
export interface PlacedOrder {
  orderId: string;
  status: PlacedOrderStatus;
  itemType: OrderItemType;
  courseId: string | null;
  seatsQuantity: number | null;
  amount: number;
  paymentMethod: PaymentMethod;
  installments: number;
  /** Data e hora local sem fuso, como o backend serializa `LocalDateTime`. */
  createdAt: string;
}

/** O que o checkout entrega à tela de confirmação pelo estado da navegação. */
export interface OrderConfirmationState {
  order: PlacedOrder;
  /** Título do curso comprado, para a confirmação não precisar buscá-lo de novo. */
  itemTitle?: string | null;
}
