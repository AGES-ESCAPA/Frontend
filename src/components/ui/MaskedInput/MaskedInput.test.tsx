import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MaskedInput } from './MaskedInput';
import type { MaskType } from './MaskedInput';

interface HarnessProps {
  mask: MaskType;
  onValueChange?: (digits: string) => void;
  initialValue?: string;
}

const Harness = ({ mask, onValueChange, initialValue = '' }: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <MaskedInput
      aria-label="Campo"
      mask={mask}
      value={value}
      onValueChange={(digits) => {
        setValue(digits);
        onValueChange?.(digits);
      }}
    />
  );
};

describe('MaskedInput', () => {
  it('displays the CPF mask while typing and reports only digits', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness mask="cpf" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, '52998224725');

    expect(input).toHaveValue('529.982.247-25');
    expect(onValueChange).toHaveBeenLastCalledWith('52998224725');
  });

  it('displays the CNPJ mask while typing and reports only digits', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness mask="cnpj" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, '11222333000181');

    expect(input).toHaveValue('11.222.333/0001-81');
    expect(onValueChange).toHaveBeenLastCalledWith('11222333000181');
  });

  it('displays the phone mask for a mobile number and reports only digits', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness mask="phone" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, '51999990001');

    expect(input).toHaveValue('(51) 99999-0001');
    expect(onValueChange).toHaveBeenLastCalledWith('51999990001');
  });

  it('displays the phone mask for a landline', async () => {
    const user = userEvent.setup();
    render(<Harness mask="phone" />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, '5133334444');

    expect(input).toHaveValue('(51) 3333-4444');
  });

  it('formats a pasted value that already has punctuation', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness mask="cpf" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Campo');
    await user.click(input);
    await user.paste('529.982.247-25');

    expect(input).toHaveValue('529.982.247-25');
    expect(onValueChange).toHaveBeenLastCalledWith('52998224725');
  });

  it('ignores letters typed by the user', async () => {
    const user = userEvent.setup();
    render(<Harness mask="cpf" />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, 'ab12c3');

    expect(input).toHaveValue('123');
  });

  it('does not accept more digits than the mask allows', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness mask="cpf" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, '5299822472599');

    expect(input).toHaveValue('529.982.247-25');
    expect(onValueChange).toHaveBeenLastCalledWith('52998224725');
  });

  it('shows the masked version of the digits received through value', () => {
    render(<Harness mask="cnpj" initialValue="11222333000181" />);

    expect(screen.getByLabelText('Campo')).toHaveValue('11.222.333/0001-81');
  });

  it('removes digits when the user erases characters', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness mask="cpf" initialValue="52998224725" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Campo');
    await user.type(input, '{Backspace}{Backspace}');

    expect(input).toHaveValue('529.982.247');
    expect(onValueChange).toHaveBeenLastCalledWith('529982247');
  });

  it('uses a placeholder matching the mask and lets the caller override it', () => {
    const { rerender } = render(
      <MaskedInput aria-label="Campo" mask="cpf" value="" onValueChange={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();

    rerender(<MaskedInput aria-label="Campo" mask="cnpj" value="" onValueChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('00.000.000/0000-00')).toBeInTheDocument();

    rerender(
      <MaskedInput
        aria-label="Campo"
        mask="phone"
        value=""
        placeholder="Telefone com DDD"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText('Telefone com DDD')).toBeInTheDocument();
  });

  it('opens a numeric keyboard on mobile devices', () => {
    const { rerender } = render(
      <MaskedInput aria-label="Campo" mask="cpf" value="" onValueChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('Campo')).toHaveAttribute('inputmode', 'numeric');

    rerender(<MaskedInput aria-label="Campo" mask="phone" value="" onValueChange={vi.fn()} />);
    expect(screen.getByLabelText('Campo')).toHaveAttribute('inputmode', 'tel');
  });

  it('passes the invalid state down to the TextInput', () => {
    render(<MaskedInput aria-label="Campo" mask="cpf" value="" onValueChange={vi.fn()} invalid />);

    expect(screen.getByLabelText('Campo')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <MaskedInput ref={ref} aria-label="Campo" mask="cpf" value="" onValueChange={vi.fn()} />,
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
