import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CourseFormField } from '@/types/course';
import { MetricsCard } from './MetricsCard';

const defaultProps = {
  durationTime: '',
  deadline: '',
  price: '',
  onFieldChange: vi.fn<(field: CourseFormField, value: string) => void>(),
};

describe('MetricsCard', () => {
  it('forwards duration, deadline and masked price changes', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<(field: CourseFormField, value: string) => void>();

    render(<MetricsCard {...defaultProps} onFieldChange={onFieldChange} />);

    await user.type(screen.getByLabelText(/carga horária/i), '40');
    expect(onFieldChange).toHaveBeenCalledWith('durationTime', expect.any(String));

    await user.type(screen.getByLabelText(/prazo de vencimento/i), '365');
    expect(onFieldChange).toHaveBeenCalledWith('deadline', expect.any(String));

    await user.type(screen.getByLabelText(/preço base/i), '199');
    expect(onFieldChange).toHaveBeenCalledWith('price', expect.any(String));
  });

  it('shows validation errors when provided', () => {
    render(
      <MetricsCard
        {...defaultProps}
        durationTimeError="Informe um valor maior que zero."
        priceError="Informe um preço maior que zero."
      />,
    );

    expect(screen.getByText('Informe um valor maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
  });
});
