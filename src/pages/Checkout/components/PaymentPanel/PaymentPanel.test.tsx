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
  it('should offer credit card, PIX and boleto', () => {
    setup();

    expect(screen.getByText('Pagar com:')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Cartão de Crédito' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'PIX' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Boleto' })).toBeInTheDocument();
    expect(screen.getByLabelText('Número do cartão')).toBeInTheDocument();
  });

  it('should show the PIX QR and confirm without card fields', async () => {
    const { onConfirm, user } = setup();

    await user.click(screen.getByRole('radio', { name: 'PIX' }));

    expect(screen.getByRole('img', { name: 'QR Code PIX de demonstração' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Número do cartão')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar Pagamento' }));

    expect(onConfirm).toHaveBeenCalledWith({
      paymentMethod: 'PIX',
      installments: 1,
    });
  });

  it('should show the boleto details and confirm payment', async () => {
    const { onConfirm, user } = setup();

    await user.click(screen.getByRole('radio', { name: 'Boleto' }));

    expect(screen.getByText(/código de barras/i)).toBeInTheDocument();
    expect(screen.getByText(/liberado após a confirmação/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /visualizar boleto/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar Pagamento' }));

    expect(onConfirm).toHaveBeenCalledWith({
      paymentMethod: 'BOLETO',
      installments: 1,
    });
  });

  it('should notify when the payment method changes', async () => {
    const onPaymentMethodChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PaymentPanel
        amount={167}
        onConfirm={vi.fn()}
        onPaymentMethodChange={onPaymentMethodChange}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'PIX' }));

    expect(onPaymentMethodChange).toHaveBeenCalledWith('PIX');
  });

  it('should show the amount on the card pay button', () => {
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
    expect(onConfirm).toHaveBeenCalledWith({
      paymentMethod: 'CARD',
      installments: 1,
    });
    expect(JSON.stringify(onConfirm.mock.calls)).not.toContain(VALID_NUMBER);
  });

  it('should confirm with the installments chosen on the form', async () => {
    const { onConfirm, user } = setup({
      amount: 600,
      maxInstallments: 3,
    });

    await fillValidCard(user);
    await user.selectOptions(screen.getByLabelText('Parcelas'), '3');
    await user.click(screen.getByRole('button', { name: 'Pagar R$600,00' }));

    expect(onConfirm).toHaveBeenCalledWith({
      paymentMethod: 'CARD',
      installments: 3,
    });
  });

  it('should show the purchase error above the pay button', () => {
    setup({ errorMessage: 'Você já tem acesso ativo a este curso.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Você já tem acesso ativo a este curso.');
  });

  it('should not show an alert when there is no error', () => {
    setup({ errorMessage: null });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should disable the pay button and show it as busy when submitting', () => {
    setup({ isSubmitting: true });

    const button = screen.getByRole('button', { name: 'Pagar R$167,00' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
