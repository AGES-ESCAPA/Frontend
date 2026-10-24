import { useEffect, useState } from 'react';
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
  /** Erro da última tentativa de confirmar a compra, mostrado acima do botão. */
  errorMessage?: string | null;
  onConfirm: (selection: PaymentSelection) => void;
}

const toButtonAmount = (amount: number): string => formatCurrency(amount).replace(/\s/g, '');

export const PaymentPanel = ({
  amount,
  maxInstallments,
  isSubmitting = false,
  errorMessage = null,
  onConfirm,
}: PaymentPanelProps) => {
  const [form, setForm] = useState<CreditCardFormChange>({
    isValid: false,
    installments: 1,
  });

  const [confirmationLocked, setConfirmationLocked] = useState(false);

  useEffect(() => {
    if (!isSubmitting) {
      setConfirmationLocked(false);
    }
  }, [isSubmitting]);

  const handleConfirm = () => {
    if (!form.isValid || isSubmitting || confirmationLocked) {
      return;
    }

    setConfirmationLocked(true);

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
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button
          variant="primary"
          fullWidth
          label={`Pagar ${toButtonAmount(amount)}`}
          disabled={!form.isValid || isSubmitting || confirmationLocked}
          isLoading={isSubmitting}
          onClick={handleConfirm}
        />
      </div>
    </section>
  );
};
