import type { ClipboardEvent, KeyboardEvent } from 'react';
import { extractDurationMaskDigits, formatDurationMaskFromDigits } from '@utils/formatters';

export interface DurationInputProps {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  className?: string;
  placeholder?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export const DurationInput = ({
  id,
  value,
  onChange,
  className,
  placeholder = '000:00',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: DurationInputProps) => {
  const display = value ? formatDurationMaskFromDigits(value) : '';

  const appendDigits = (next: string) => {
    onChange(extractDurationMaskDigits(`${value}${next}`));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      appendDigits(event.key);
      return;
    }

    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    if (!value) return;

    const input = event.currentTarget;
    const { selectionStart, selectionEnd } = input;
    const allSelected = selectionStart === 0 && selectionEnd === display.length;
    const atEnd = selectionStart === display.length && selectionEnd === display.length;

    if (event.key === 'Backspace' && !allSelected && !atEnd) return;

    event.preventDefault();
    onChange(allSelected ? '' : value.slice(0, -1));
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    appendDigits(event.clipboardData.getData('text'));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={display}
      readOnly
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
    />
  );
};
