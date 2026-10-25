export type OrderItemType = 'COURSE' | 'SEATS';

export type PaymentMethod = 'CARD' | 'PIX' | 'BOLETO';

export type PlacedOrderStatus = 'APPROVED' | 'CANCELLED' | 'REFUNDED';

export type AdminOrderStatus = PlacedOrderStatus;

export type AdminOrderType = 'INDIVIDUAL' | 'CORPORATE';

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

/** Filtros aceitos por `GET /api/v1/admin/orders`. Vazio ou `undefined` significa "sem filtro". */
export interface AdminOrderFilters {
  type?: AdminOrderType;
  courseId?: string;
  /** Datas no formato `yyyy-MM-dd`. */
  from?: string;
  to?: string;
  status?: AdminOrderStatus;
}

/** Item da listagem de `GET /api/v1/admin/orders` (resumo, sem os dados do comprador). */
export interface AdminOrderSummary {
  id: string;
  requester: string;
  type: AdminOrderType;
  /** `null` em pedido de assentos: não está ligado a um curso específico. */
  courseTitle: string | null;
  /** `null` em pedido de curso: só pedidos de assentos têm quantidade. */
  seatsQuantity: number | null;
  /** Data e hora local sem fuso, como o backend serializa `LocalDateTime`. */
  purchaseDate: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: AdminOrderStatus;
}

export interface AdminOrderPage {
  content: AdminOrderSummary[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminOrderStatusChange {
  id: string;
  status: AdminOrderStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

/** Detalhe de `GET /api/v1/admin/orders/{id}`. */
export interface AdminOrderDetails {
  id: string;
  type: AdminOrderType;
  buyer: {
    id: string;
    name: string;
    email: string;
    /** CPF do aluno ou CNPJ da empresa. */
    document: string;
    phone: string;
  } | null;
  item: {
    type: OrderItemType;
    courseId: string | null;
    courseTitle: string | null;
    seatsQuantity: number | null;
  };
  amount: number;
  paymentMethod: PaymentMethod;
  installments: number | null;
  status: AdminOrderStatus;
  createdAt: string;
  statusHistory: AdminOrderStatusChange[];
  /** Só em pedido corporativo de curso; `null` nos demais. */
  collaboratorsWithAccessCount: number | null;
}
