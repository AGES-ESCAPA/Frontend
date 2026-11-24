import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DurationInput } from './DurationInput';

const ControlledDurationInput = () => {
  const [value, setValue] = useState('');
  return <DurationInput id="dur" value={value} onChange={setValue} />;
};

describe('DurationInput', () => {
  it('formats digits as the user types on the keyboard', () => {
    render(<ControlledDurationInput />);

    const input = screen.getByRole('textbox');
    for (const digit of '1240'.split('')) {
      fireEvent.keyDown(input, { key: digit, currentTarget: input });
    }

    expect(screen.getByDisplayValue('12:40')).toBeInTheDocument();
  });

  it('displays the formatted mask from the digit buffer', () => {
    render(<DurationInput id="dur" value="1240" onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('12:40')).toHaveValue('12:40');
  });

  it('clears the buffer on backspace at the end', () => {
    const onChange = vi.fn();

    render(<DurationInput id="dur" value="1240" onChange={onChange} />);

    const input = screen.getByDisplayValue('12:40') as HTMLInputElement;
    input.setSelectionRange(input.value.length, input.value.length);
    fireEvent.keyDown(input, { key: 'Backspace', currentTarget: input });

    expect(onChange).toHaveBeenCalledWith('124');
  });
});
