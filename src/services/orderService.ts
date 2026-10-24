import { api, authenticatedFetch } from '@services/api';
import type { ApiResponse } from '@services/api';
import type { CreateOrderPayload, PlacedOrder } from '@/types/order';

export class OrderServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'OrderServiceError';
    this.status = status;
  }
}

const NETWORK_ERROR_MESSAGE =
  'Não foi possível concluir a compra. Verifique sua conexão e tente novamente.';

/** Mensagens em português por status: as da API vêm em inglês e não servem para o usuário. */
const messageForStatus = (status: number): string => {
  switch (status) {
    case 400:
      return 'Não foi possível processar a compra. Confira os dados e tente novamente.';
    case 401:
      return 'Sua sessão expirou. Entre novamente para concluir a compra.';
    case 403:
      return 'Seu perfil não pode realizar esta compra.';
    case 404:
      return 'Curso não encontrado.';
    case 409:
      return 'Você já tem acesso ativo a este curso.';
    default:
      return 'Não foi possível concluir a compra. Tente novamente em instantes.';
  }
};

/**
 * Registra a compra simulada. A API aprova o pedido na hora e libera o acesso na mesma transação
 * (matrícula do aluno, curso da empresa ou assentos), então não há segundo passo de confirmação.
 */
export const createOrder = async (payload: CreateOrderPayload): Promise<PlacedOrder> => {
  let response: Response;

  try {
    response = await authenticatedFetch(`${api.baseUrl}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OrderServiceError(0, NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new OrderServiceError(response.status, messageForStatus(response.status));
  }

  const json: ApiResponse<PlacedOrder> = await response.json();
  return json.data;
};
