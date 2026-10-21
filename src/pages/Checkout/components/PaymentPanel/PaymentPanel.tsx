import { useState } from 'react';
import { Button, CreditCardForm } from '@components/ui';
import type { CreditCardFormChange } from '@components/ui';
import { formatCurrency } from '@utils/formatters';
import styles from './PaymentPanel.module.css';

/** O que a tela entrega à confirmação da compra (US-27): nenhum dado do cartão sai daqui. */
export interface PaymentSelection {
  paymentMethod: 'CARD';
  installments: number;
}

export interface PaymentPanelProps {
  /** Valor total da compra, mostrado no botão e usado no valor de cada parcela. */
  amount: number;
  maxInstallments?: number;
  /** Bloqueia o botão e mostra o carregando enquanto a confirmação está em andamento. */
  isSubmitting?: boolean;
  onConfirm: (selection: PaymentSelection) => void;
}

/** "R$ 167,00" vira "R$167,00", como no botão do layout. */
const toButtonAmount = (amount: number): string => formatCurrency(amount).replace(/\s/g, '');

/**
 * Painel "Pagar com:". Só existe uma forma de pagamento, o cartão de crédito:
 * não há campos de PIX nem de boleto. O formulário guarda os dados do cartão
 * só no navegador e informa apenas se está válido e o número de parcelas.
 */
export const PaymentPanel = ({
  amount,
  maxInstallments,
  isSubmitting = false,
  onConfirm,
}: PaymentPanelProps) => {
  const [form, setForm] = useState<CreditCardFormChange>({ isValid: false, installments: 1 });

  const handleConfirm = () => {
    onConfirm({ paymentMethod: 'CARD', installments: form.installments });
  };

  return (
    <section className={styles.panel} aria-labelledby="payment-panel-title">
      <h2 id="payment-panel-title" className={styles.title}>
        Pagar com:
      </h2>

      <div className={styles.method} role="radiogroup" aria-labelledby="payment-panel-title">
        <label className={styles.methodOption}>
          <input type="radio" name="payment-method" value="CARD" checked readOnly />
          Cartão de Crédito
        </label>
      </div>

      <CreditCardForm amount={amount} maxInstallments={maxInstallments} onChange={setForm} />

      <div className={styles.confirm}>
        <Button
          variant="primary"
          fullWidth
          label={`Pagar ${toButtonAmount(amount)}`}
          disabled={!form.isValid}
          isLoading={isSubmitting}
          onClick={handleConfirm}
        />
      </div>
    </section>
  );
};
