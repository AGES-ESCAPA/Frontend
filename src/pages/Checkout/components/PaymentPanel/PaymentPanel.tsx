import { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Barcode, Copy } from 'lucide-react';
import pixQrCode from '@assets/pix-qrcode.svg';
import { Button, CreditCardForm } from '@components/ui';
import type { CreditCardFormChange } from '@components/ui';
import { formatCurrency } from '@utils/formatters';
import {
  MOCK_BOLETO_BANK,
  MOCK_BOLETO_BENEFICIARY,
  MOCK_BOLETO_DIGITAL_LINE,
  MOCK_PIX_COPY_CODE,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_SUMMARY_LABELS,
  getMockBoletoDueLabel,
  type CheckoutPaymentMethod,
} from './PaymentPanel.constants';
import styles from './PaymentPanel.module.css';

export interface PaymentSelection {
  paymentMethod: CheckoutPaymentMethod;
  installments: number;
}

export interface PaymentPanelProps {
  amount: number;
  maxInstallments?: number;
  isSubmitting?: boolean;
  /** Erro da última tentativa de confirmar a compra, mostrado acima do botão. */
  errorMessage?: string | null;
  /** Ação ao lado do erro (ex.: link para o curso que o usuário já tem). */
  errorAction?: ReactNode;
  onConfirm: (selection: PaymentSelection) => void;
  /** Avisa o checkout para atualizar o resumo quando a forma de pagamento muda. */
  onPaymentMethodChange?: (method: CheckoutPaymentMethod) => void;
}

const toButtonAmount = (amount: number): string => formatCurrency(amount).replace(/\s/g, '');

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Sem clipboard (permissão/HTTP): o código continua visível na tela.
  }
};

/** Código de barras decorativo a partir da linha digitável. */
const MockBarcode = ({ value }: { value: string }) => {
  const bars = useMemo(
    () =>
      value
        .replace(/\D/g, '')
        .split('')
        .flatMap((digit, index) => {
          const n = Number(digit);
          return [2 + (n % 3), 1 + ((n + index) % 2)];
        }),
    [value],
  );

  const width = bars.reduce((sum, w) => sum + w, 0);

  let x = 0;
  return (
    <svg
      className={styles.barcode}
      viewBox={`0 0 ${width} 40`}
      role="img"
      aria-label="Código de barras do boleto de demonstração"
      preserveAspectRatio="none"
    >
      <rect width={width} height={40} fill="#fff" />
      {bars.map((barWidth, index) => {
        const rect = (
          <rect
            key={index}
            x={x}
            y={0}
            width={barWidth}
            height={40}
            fill={index % 2 === 0 ? '#111' : '#fff'}
          />
        );
        x += barWidth;
        return rect;
      })}
    </svg>
  );
};

export const PaymentPanel = ({
  amount,
  maxInstallments,
  isSubmitting = false,
  errorMessage = null,
  errorAction,
  onConfirm,
  onPaymentMethodChange,
}: PaymentPanelProps) => {
  const methodsId = useId();
  const [method, setMethod] = useState<CheckoutPaymentMethod>('CARD');
  const [form, setForm] = useState<CreditCardFormChange>({
    isValid: false,
    installments: 1,
  });
  const [confirmationLocked, setConfirmationLocked] = useState(false);
  const boletoDueLabel = useMemo(() => getMockBoletoDueLabel(), []);

  useEffect(() => {
    if (!isSubmitting) {
      setConfirmationLocked(false);
    }
  }, [isSubmitting]);

  const selectMethod = (next: CheckoutPaymentMethod) => {
    if (isSubmitting || confirmationLocked || next === method) return;
    setMethod(next);
    onPaymentMethodChange?.(next);
  };

  const canConfirm = !isSubmitting && !confirmationLocked && (method !== 'CARD' || form.isValid);

  const handleConfirm = () => {
    if (!canConfirm) return;

    setConfirmationLocked(true);
    onConfirm({
      paymentMethod: method,
      installments: method === 'CARD' ? form.installments : 1,
    });
  };

  const confirmLabel =
    method === 'CARD' ? `Pagar ${toButtonAmount(amount)}` : 'Confirmar Pagamento';

  return (
    <section className={styles.panel} aria-labelledby="payment-panel-title">
      <h2 id="payment-panel-title" className={styles.title}>
        Pagar com:
      </h2>

      <div className={styles.methods} role="radiogroup" aria-labelledby="payment-panel-title">
        {PAYMENT_METHOD_OPTIONS.map((option) => {
          const optionId = `${methodsId}-${option.value}`;
          const selected = method === option.value;

          return (
            <label key={option.value} className={styles.methodOption} htmlFor={optionId}>
              <input
                id={optionId}
                className={styles.methodInput}
                type="radio"
                name={methodsId}
                value={option.value}
                checked={selected}
                disabled={isSubmitting || confirmationLocked}
                onChange={() => selectMethod(option.value)}
              />
              <span className={styles.methodControl} aria-hidden="true" data-selected={selected} />
              <span className={styles.methodLabel}>{option.label}</span>
            </label>
          );
        })}
      </div>

      {method === 'CARD' ? (
        <CreditCardForm amount={amount} maxInstallments={maxInstallments} onChange={setForm} />
      ) : null}

      {method === 'PIX' ? (
        <div className={styles.altMethod}>
          <div className={styles.qrFrame}>
            <img
              className={styles.qr}
              src={pixQrCode}
              alt="QR Code PIX de demonstração"
              width={307}
              height={307}
            />
          </div>
          <button
            type="button"
            className={styles.copyRow}
            onClick={() => void copyText(MOCK_PIX_COPY_CODE)}
            aria-label="Copiar código PIX"
          >
            <Copy size={16} aria-hidden="true" />
            <span className={styles.copyCode}>{MOCK_PIX_COPY_CODE}</span>
          </button>
        </div>
      ) : null}

      {method === 'BOLETO' ? (
        <div className={styles.altMethod}>
          <div className={styles.boletoCard}>
            <span className={styles.boletoIcon} aria-hidden="true">
              <Barcode size={20} />
            </span>
            <div className={styles.boletoInfo}>
              <p className={styles.boletoBeneficiary}>{MOCK_BOLETO_BENEFICIARY}</p>
              <p className={styles.boletoAmount}>{formatCurrency(amount)}</p>
              <p className={styles.boletoMeta}>{boletoDueLabel}</p>
              <p className={styles.boletoMeta}>Instituição financeira • {MOCK_BOLETO_BANK}</p>
            </div>
          </div>

          <p className={styles.barcodeLabel}>Código de barras</p>
          <div className={styles.barcodeFrame}>
            <MockBarcode value={MOCK_BOLETO_DIGITAL_LINE} />
          </div>
          <button
            type="button"
            className={styles.copyRow}
            onClick={() => void copyText(MOCK_BOLETO_DIGITAL_LINE)}
            aria-label="Copiar linha digitável do boleto"
          >
            <Copy size={16} aria-hidden="true" />
            <span className={styles.copyCode}>{MOCK_BOLETO_DIGITAL_LINE}</span>
          </button>
          <p className={styles.boletoHint}>
            Seu acesso ao curso será liberado após a confirmação do pagamento
          </p>
        </div>
      ) : null}

      <div className={styles.confirm}>
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
            {errorAction ? <span className={styles.errorAction}>{errorAction}</span> : null}
          </p>
        ) : null}
        <Button
          variant="primary"
          fullWidth
          label={confirmLabel}
          disabled={!canConfirm}
          isLoading={isSubmitting}
          onClick={handleConfirm}
        />
      </div>
    </section>
  );
};

export { PAYMENT_METHOD_SUMMARY_LABELS };
