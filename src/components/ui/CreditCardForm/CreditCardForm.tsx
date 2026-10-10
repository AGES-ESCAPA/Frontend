import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Calendar, CreditCard, Shield, User } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import {
  detectCardBrand,
  isValidCardCvv,
  isValidCardExpiry,
  isValidCardHolderName,
  isValidCardNumber,
  maskCardCvv,
  maskCardExpiry,
  maskCardHolderName,
  maskCardNumber,
} from '@utils/creditCard';
import type { CardBrand } from '@utils/creditCard';
import amexLogo from '@assets/card-brands/amex.svg';
import dinersLogo from '@assets/card-brands/diners.svg';
import discoverLogo from '@assets/card-brands/discover.svg';
import eloLogo from '@assets/card-brands/elo.svg';
import hipercardLogo from '@assets/card-brands/hipercard.svg';
import jcbLogo from '@assets/card-brands/jcb.svg';
import mastercardLogo from '@assets/card-brands/mastercard.svg';
import visaLogo from '@assets/card-brands/visa.svg';
import { SelectInput } from '../SelectInput';
import { TextInput } from '../TextInput';
import styles from './CreditCardForm.module.css';

export interface CreditCardFormChange {
  isValid: boolean;
  installments: number;
}

export interface CreditCardFormProps {
  /** Recebe apenas se o formulário é válido e o número de parcelas — nunca os dados do cartão. */
  onChange: (change: CreditCardFormChange) => void;
  /** Valor total da compra, usado para calcular o valor de cada parcela. */
  amount: number;
  /** Máximo de parcelas. Com 1 (padrão) o campo de parcelas não é exibido. */
  maxInstallments?: number;
  className?: string;
}

type FieldName = 'holderName' | 'number' | 'expiry' | 'cvv';

const FIELD_ERRORS: Record<FieldName, string> = {
  holderName: 'Informe o nome impresso no cartão.',
  number: 'Número de cartão inválido.',
  expiry: 'Validade inválida ou cartão vencido.',
  cvv: 'O CVV deve ter 3 ou 4 dígitos.',
};

const PLACEHOLDER_HOLDER = 'NOME DO TITULAR';
const PLACEHOLDER_EXPIRY = 'MM/AA';
const HIDDEN_GROUP = '****';

/** Mostra os grupos já digitados como "****" e só deixa o último grupo visível. */
const toPreviewNumber = (maskedNumber: string): string => {
  const groups = maskedNumber === '' ? [] : maskedNumber.split(' ');
  const lastIndex = groups.length - 1;
  const shown = groups.map((group, index) =>
    index === lastIndex && lastIndex > 0 ? group : HIDDEN_GROUP,
  );
  while (shown.length < 4) shown.push(HIDDEN_GROUP);
  return shown.join(' ');
};

const BRAND_LABELS: Record<CardBrand, string> = {
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  elo: 'Elo',
  hipercard: 'Hipercard',
  jcb: 'JCB',
  mastercard: 'Mastercard',
  visa: 'Visa',
};

const BRAND_LOGOS: Record<CardBrand, string> = {
  amex: amexLogo,
  diners: dinersLogo,
  discover: discoverLogo,
  elo: eloLogo,
  hipercard: hipercardLogo,
  jcb: jcbLogo,
  mastercard: mastercardLogo,
  visa: visaLogo,
};

const CardBrandMark = ({ brand }: { brand: CardBrand | null }) =>
  brand === null ? (
    <CreditCard className={styles.brandFallback} size={32} aria-hidden="true" />
  ) : (
    <img className={styles.brand} src={BRAND_LOGOS[brand]} alt={BRAND_LABELS[brand]} />
  );

export const CreditCardForm = ({
  onChange,
  amount,
  maxInstallments = 1,
  className = '',
}: CreditCardFormProps) => {
  const baseId = useId();
  const [holderName, setHolderName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    holderName: false,
    number: false,
    expiry: false,
    cvv: false,
  });

  const installmentLimit = Math.max(1, Math.floor(maxInstallments));
  const installments = Math.min(selectedInstallments, installmentLimit);

  const validity: Record<FieldName, boolean> = {
    holderName: isValidCardHolderName(holderName),
    number: isValidCardNumber(number),
    expiry: isValidCardExpiry(expiry),
    cvv: isValidCardCvv(cvv),
  };
  const isValid = Object.values(validity).every(Boolean);

  // Guarda o callback mais recente para o efeito abaixo só disparar quando o
  // resultado muda, mesmo que o pai passe uma função nova a cada render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current({ isValid, installments });
  }, [isValid, installments]);

  const markTouched = (field: FieldName) => () =>
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));

  const errorFor = (field: FieldName): string | undefined =>
    touched[field] && !validity[field] ? FIELD_ERRORS[field] : undefined;

  const installmentOptions = Array.from({ length: installmentLimit }, (_, index) => {
    const count = index + 1;
    return { value: String(count), label: `${count}x de ${formatCurrency(amount / count)}` };
  });

  const ids = {
    holderName: `${baseId}-holder`,
    number: `${baseId}-number`,
    expiry: `${baseId}-expiry`,
    cvv: `${baseId}-cvv`,
    installments: `${baseId}-installments`,
  };

  const renderError = (field: FieldName) => {
    const message = errorFor(field);
    return message === undefined ? null : (
      <p id={`${ids[field]}-error`} className={styles.error} role="alert">
        {message}
      </p>
    );
  };

  const describedBy = (field: FieldName) =>
    errorFor(field) === undefined ? undefined : `${ids[field]}-error`;

  return (
    <div className={`${styles.form} ${className}`.trim()}>
      <div className={styles.card} aria-hidden="true" data-testid="credit-card-preview">
        <CardBrandMark brand={detectCardBrand(number)} />
        <div className={styles.cardInfo}>
          <p className={styles.cardNumber}>{toPreviewNumber(number)}</p>
          <p className={styles.cardHolder}>{holderName.trim() || PLACEHOLDER_HOLDER}</p>
          <p className={styles.cardExpiry}>{expiry || PLACEHOLDER_EXPIRY}</p>
        </div>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={ids.holderName}>
            Nome impresso no cartão
          </label>
          <TextInput
            className={styles.input}
            id={ids.holderName}
            icon={<User size={16} />}
            value={holderName}
            placeholder="JORGE AMADO"
            autoComplete="cc-name"
            invalid={errorFor('holderName') !== undefined}
            aria-describedby={describedBy('holderName')}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setHolderName(maskCardHolderName(event.target.value))
            }
            onBlur={markTouched('holderName')}
          />
          {renderError('holderName')}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={ids.number}>
            Número do cartão
          </label>
          <TextInput
            className={styles.input}
            id={ids.number}
            icon={<CreditCard size={16} />}
            value={number}
            placeholder="1234 5678 9101 1121"
            inputMode="numeric"
            autoComplete="cc-number"
            invalid={errorFor('number') !== undefined}
            aria-describedby={describedBy('number')}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNumber(maskCardNumber(event.target.value))
            }
            onBlur={markTouched('number')}
          />
          {renderError('number')}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={ids.expiry}>
              Data de vencimento
            </label>
            <TextInput
              className={styles.input}
              id={ids.expiry}
              icon={<Calendar size={16} />}
              value={expiry}
              placeholder={PLACEHOLDER_EXPIRY}
              inputMode="numeric"
              autoComplete="cc-exp"
              invalid={errorFor('expiry') !== undefined}
              aria-describedby={describedBy('expiry')}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setExpiry(maskCardExpiry(event.target.value))
              }
              onBlur={markTouched('expiry')}
            />
            {renderError('expiry')}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={ids.cvv}>
              CVV
            </label>
            <TextInput
              className={styles.input}
              id={ids.cvv}
              icon={<Shield size={16} />}
              value={cvv}
              placeholder="000"
              inputMode="numeric"
              autoComplete="cc-csc"
              invalid={errorFor('cvv') !== undefined}
              aria-describedby={describedBy('cvv')}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setCvv(maskCardCvv(event.target.value))
              }
              onBlur={markTouched('cvv')}
            />
            {renderError('cvv')}
          </div>
        </div>

        {installmentLimit > 1 ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor={ids.installments}>
              Parcelas
            </label>
            <SelectInput
              id={ids.installments}
              value={String(installments)}
              options={installmentOptions}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSelectedInstallments(Number(event.target.value))
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
