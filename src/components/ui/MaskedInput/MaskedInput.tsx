import { forwardRef } from 'react';
import type { ChangeEvent } from 'react';
import { maskCnpj, maskCpf, maskPhone, onlyDigits } from '@utils/masks';
import { TextInput } from '../TextInput';
import type { TextInputProps } from '../TextInput';

export type MaskType = 'cpf' | 'cnpj' | 'phone';

interface MaskConfig {
  format: (value: string) => string;
  maxDigits: number;
  placeholder: string;
  inputMode: 'numeric' | 'tel';
  autoComplete?: string;
}

const MASK_CONFIG: Record<MaskType, MaskConfig> = {
  cpf: {
    format: maskCpf,
    maxDigits: 11,
    placeholder: '000.000.000-00',
    inputMode: 'numeric',
  },
  cnpj: {
    format: maskCnpj,
    maxDigits: 14,
    placeholder: '00.000.000/0000-00',
    inputMode: 'numeric',
  },
  phone: {
    format: maskPhone,
    maxDigits: 11,
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
  /** Valor atual somente com dígitos (sem pontos, traços ou parênteses). */
  value: string;
  /** Chamado a cada alteração, sempre com somente os dígitos. */
  onValueChange: (digits: string) => void;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onValueChange, placeholder, ...props }, ref) => {
    const config = MASK_CONFIG[mask];

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(onlyDigits(event.target.value).slice(0, config.maxDigits));
    };

    return (
      <TextInput
        ref={ref}
        inputMode={config.inputMode}
        autoComplete={config.autoComplete}
        placeholder={placeholder ?? config.placeholder}
        {...props}
        value={config.format(value)}
        onChange={handleChange}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
