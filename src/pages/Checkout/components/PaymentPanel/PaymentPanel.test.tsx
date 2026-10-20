import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PaymentPanel } from './PaymentPanel';

const VALID_NUMBER = '4539148803436467';

const setup = (props: Partial<Parameters<typeof PaymentPanel>[0]> = {}) => {
  const onConfirm = vi.fn();
  const user = userEvent.setup();
  render(<PaymentPanel amount={167} onConfirm={onConfirm} {...props} />);
  return { onConfirm, user };
};

const fillValidCard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Nome impresso no cartão'), 'jorge amado');
  await user.type(screen.getByLabelText('Número do cartão'), VALID_NUMBER);
  await user.type(screen.getByLabelText('Data de vencimento'), '1299');
  await user.type(screen.getByLabelText('CVV'), '123');
};

describe('PaymentPanel', () => {
  it('should offer a single payment method, credit card, already selected', () => {
    setup();

    const methods = screen.getAllByRole('radio');

    expect(methods).toHaveLength(1);
    expect(methods[0]).toBeChecked();
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
    expect(screen.getByText('Pagar com:')).toBeInTheDocument();
  });

  it('should not offer PIX or boleto', () => {
    setup();

    expect(screen.queryByText(/pix/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/boleto/i)).not.toBeInTheDocument();
  });

  it('should render the credit card form fields', () => {
    setup();

    expect(screen.getByLabelText('Nome impresso no cartão')).toBeInTheDocument();
    expect(screen.getByLabelText('Número do cartão')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de vencimento')).toBeInTheDocument();
    expect(screen.getByLabelText('CVV')).toBeInTheDocument();
  });

  it('should show the amount on the pay button', () => {
    setup({ amount: 167 });

    expect(screen.getByRole('button', { name: 'Pagar R$167,00' })).toBeInTheDocument();
  });

  it('should format a value with thousands separator and cents on the pay button', () => {
    setup({ amount: 1234.5 });

    expect(screen.getByRole('button', { name: 'Pagar R$1.234,50' })).toBeInTheDocument();
  });

  it('should keep the pay button disabled while the card form is invalid', async () => {
    const { onConfirm, user } = setup();
    const button = screen.getByRole('button', { name: 'Pagar R$167,00' });

    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Número do cartão'), '1234');
    await user.click(button);

    expect(button).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should enable the pay button once the card form is valid', async () => {
    const { user } = setup();

    await fillValidCard(user);

    expect(screen.getByRole('button', { name: 'Pagar R$167,00' })).toBeEnabled();
  });

  it('should confirm with only the payment method and the installments', async () => {
    const { onConfirm, user } = setup();
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({ paymentMethod: 'CARD', installments: 1 });
    expect(JSON.stringify(onConfirm.mock.calls)).not.toContain(VALID_NUMBER);
  });

  it('should confirm with the installments chosen on the form', async () => {
    const { onConfirm, user } = setup({ amount: 600, maxInstallments: 3 });
    await fillValidCard(user);
    await user.selectOptions(screen.getByLabelText('Parcelas'), '3');

    await user.click(screen.getByRole('button', { name: 'Pagar R$600,00' }));

    expect(onConfirm).toHaveBeenCalledWith({ paymentMethod: 'CARD', installments: 3 });
  });

  it('should disable the pay button and show it as busy when submitting', () => {
    setup({ isSubmitting: true });

    const button = screen.getByRole('button', { name: 'Pagar R$167,00' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
