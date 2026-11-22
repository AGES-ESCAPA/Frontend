import type { PaymentMethod } from '@/types/order';

export type CheckoutPaymentMethod = PaymentMethod;

export const PAYMENT_METHOD_OPTIONS: ReadonlyArray<{
  value: CheckoutPaymentMethod;
  label: string;
}> = [
  { value: 'CARD', label: 'Cartão de Crédito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
];

export const PAYMENT_METHOD_SUMMARY_LABELS: Record<CheckoutPaymentMethod, string> = {
  CARD: 'Cartão de Crédito',
  PIX: 'PIX',
  BOLETO: 'Boleto',
};

/** Código PIX copia-e-cola de demonstração (sem integração bancária). */
export const MOCK_PIX_COPY_CODE =
  '00020126580014BR.GOV.BCB.PIX0136123E4567-E89B-12D3-A456-4266141740005204000053039865802BR5925NOME DO RECEBEDOR EXEMPLO6009SAO PAULO62070503***63041D3D';

export const MOCK_BOLETO_BENEFICIARY = 'OMINI S A CREDITO FINANCIAMENTO E INVESTI';
export const MOCK_BOLETO_BANK = '033 - Bco Santander Brasil S.A.';
export const MOCK_BOLETO_DIGITAL_LINE = '34191.79001 01043.510047 91020.150008 2 91510026000';

/** Vencimento mock: 3 dias a partir de hoje, em pt-BR. */
export const getMockBoletoDueLabel = (now = new Date()): string => {
  const due = new Date(now);
  due.setDate(due.getDate() + 3);

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(due);

  return `Vencimento • ${formatted}`;
};
