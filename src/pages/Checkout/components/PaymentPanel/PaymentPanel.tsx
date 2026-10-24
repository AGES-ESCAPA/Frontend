import { useRef, useState } from 'react';
import { Button, CreditCardForm } from '@components/ui';
import type { CreditCardFormChange } from '@components/ui';
import { formatCurrency } from '@utils/formatters';
import styles from './PaymentPanel.module.css';

export interface PaymentSelection {
  paymentMethod: 'CARD';
  installments: number;
}

export interface PaymentPanelProps {
  amount: number;
  maxInstallments?: number;
  isSubmitting?: boolean;
  onConfirm: (selection: PaymentSelection) => void;
}

const toButtonAmount = (amount: number): string => formatCurrency(amount).replace(/\s/g, '');

export const PaymentPanel = ({
  amount,
  maxInstallments,
  isSubmitting = false,
  onConfirm,
}: PaymentPanelProps) => {
  const [form, setForm] = useState<CreditCardFormChange>({
    isValid: false,
    installments: 1,
  });

  const confirmationLocked = useRef(false);

  const handleConfirm = () => {
    if (!form.isValid || isSubmitting || confirmationLocked.current) {
      return;
    }

    confirmationLocked.current = true;

    onConfirm({
      paymentMethod: 'CARD',
      installments: form.installments,
    });
  };

  return (
    <section className={styles.panel} aria-labelledby="payment-panel-title">
      <h2 id="payment-panel-title" className={styles.title}>
        Pagar com:
      </h2>

      <CreditCardForm amount={amount} maxInstallments={maxInstallments} onChange={setForm} />

      <div className={styles.confirm}>
        <Button
          variant="primary"
          fullWidth
          label={`Pagar ${toButtonAmount(amount)}`}
          disabled={!form.isValid || isSubmitting || confirmationLocked.current}
          isLoading={isSubmitting}
          onClick={handleConfirm}
        />
      </div>
    </section>
  );
};
