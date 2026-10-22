import { forwardRef } from 'react';
import type { ChangeEvent } from 'react';
import { maskCnpj, maskCpf, maskPhone, normalizeCnpj, onlyDigits } from '@utils/masks';
import { TextInput } from '../TextInput';
import type { TextInputProps } from '../TextInput';

export type MaskType = 'cpf' | 'cnpj' | 'phone';

const CPF_DIGITS = 11;
const PHONE_DIGITS = 11;

interface MaskConfig {
  /** Aplica a máscara a um valor já normalizado. */
  format: (value: string) => string;
  /** Extrai do texto digitado o valor sem máscara que sobe para o formulário. */
  normalize: (value: string) => string;
  placeholder: string;
  inputMode: 'numeric' | 'tel' | 'text';
  autoComplete?: string;
  autoCapitalize?: 'characters';
}

const MASK_CONFIG: Record<MaskType, MaskConfig> = {
  cpf: {
    format: maskCpf,
    normalize: (value) => onlyDigits(value).slice(0, CPF_DIGITS),
    placeholder: '000.000.000-00',
    inputMode: 'numeric',
  },
  // CNPJ alfanumérico (desde julho/2026): letras nas 12 primeiras posições.
  cnpj: {
    format: maskCnpj,
    normalize: normalizeCnpj,
    placeholder: '00.000.000/0000-00',
    inputMode: 'text',
    autoCapitalize: 'characters',
  },
  phone: {
    format: maskPhone,
    normalize: (value) => onlyDigits(value).slice(0, PHONE_DIGITS),
    placeholder: '(00) 00000-0000',
    inputMode: 'tel',
    autoComplete: 'tel-national',
  },
};

export interface MaskedInputProps extends Omit<
  TextInputProps,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  /** Tipo de máscara aplicada ao campo. */
  mask: MaskType;
  /**
   * Valor atual sem máscara: só dígitos no CPF e no telefone; no CNPJ, números e
   * letras maiúsculas (sem pontos, barra ou traço).
   */
  value: string;
  /** Chamado a cada alteração, sempre com o valor sem máscara. */
  onValueChange: (value: string) => void;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onValueChange, placeholder, ...props }, ref) => {
    const config = MASK_CONFIG[mask];

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(config.normalize(event.target.value));
    };

    return (
      <TextInput
        ref={ref}
        inputMode={config.inputMode}
        autoComplete={config.autoComplete}
        autoCapitalize={config.autoCapitalize}
        placeholder={placeholder ?? config.placeholder}
        {...props}
        value={config.format(value)}
        onChange={handleChange}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
