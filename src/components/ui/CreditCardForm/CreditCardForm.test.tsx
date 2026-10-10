import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { formatCurrency } from '@utils/formatters';
import { CreditCardForm } from './CreditCardForm';

const VALID_NUMBER = '4539148803436467';

const setup = (props: Partial<Parameters<typeof CreditCardForm>[0]> = {}) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<CreditCardForm amount={167} onChange={onChange} {...props} />);
  return { onChange, user };
};

const getFields = () => ({
  holder: screen.getByLabelText('Nome impresso no cartão'),
  number: screen.getByLabelText('Número do cartão'),
  expiry: screen.getByLabelText('Data de vencimento'),
  cvv: screen.getByLabelText('CVV'),
});

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  const { holder, number, expiry, cvv } = getFields();
  await user.type(holder, 'jorge amado');
  await user.type(number, VALID_NUMBER);
  await user.type(expiry, '1299');
  await user.type(cvv, '123');
};

describe('CreditCardForm', () => {
  describe('masks', () => {
    it('should group the card number in blocks of 4 digits', async () => {
      const { user } = setup();
      const { number } = getFields();

      await user.type(number, '1234567891011121abc');

      expect(number).toHaveValue('1234 5678 9101 1121');
    });

    it('should format the expiry as MM/AA', async () => {
      const { user } = setup();
      const { expiry } = getFields();

      await user.type(expiry, '0328');

      expect(expiry).toHaveValue('03/28');
    });

    it('should keep only digits in the CVV, up to 4', async () => {
      const { user } = setup();
      const { cvv } = getFields();

      await user.type(cvv, '12a345');

      expect(cvv).toHaveValue('1234');
    });

    it('should uppercase the holder name and drop digits', async () => {
      const { user } = setup();
      const { holder } = getFields();

      await user.type(holder, 'jorge 1amado');

      expect(holder).toHaveValue('JORGE AMADO');
    });
  });

  describe('card preview', () => {
    it('should hide the typed number except the last group and mirror name and expiry', async () => {
      const { user } = setup();
      const { holder, number, expiry } = getFields();
      const preview = screen.getByTestId('credit-card-preview');

      expect(preview).toHaveTextContent('**** **** **** ****');
      expect(preview).toHaveTextContent('NOME DO TITULAR');

      await user.type(holder, 'Jorge Amado');
      await user.type(number, '1234567891011121');
      await user.type(expiry, '0328');

      expect(preview).toHaveTextContent('**** **** **** 1121');
      expect(preview).toHaveTextContent('JORGE AMADO');
      expect(preview).toHaveTextContent('03/28');
      expect(preview).not.toHaveTextContent('1234');
    });
  });

  describe('card brand', () => {
    it('should show no brand logo while the number is empty or unrecognised', async () => {
      const { user } = setup();
      const preview = screen.getByTestId('credit-card-preview');

      expect(within(preview).queryByRole('img', { hidden: true })).not.toBeInTheDocument();

      await user.type(getFields().number, '1234');

      expect(within(preview).queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    });

    it.each([
      ['4539148803436467', 'Visa'],
      ['5555555555554444', 'Mastercard'],
      ['4011780000000000', 'Elo'],
      ['378282246310005', 'American Express'],
    ])('should show the %s brand matching the typed number (%s)', async (number, brandName) => {
      const { user } = setup();

      await user.type(getFields().number, number);

      expect(screen.getByAltText(brandName)).toBeInTheDocument();
    });

    it('should switch the logo when the number changes to another brand', async () => {
      const { user } = setup();
      const { number } = getFields();

      await user.type(number, '4111');
      expect(screen.getByAltText('Visa')).toBeInTheDocument();

      await user.clear(number);
      await user.type(number, '5555');

      expect(screen.queryByAltText('Visa')).not.toBeInTheDocument();
      expect(screen.getByAltText('Mastercard')).toBeInTheDocument();
    });
  });

  describe('validation on blur', () => {
    it('should not show errors before the user leaves a field', async () => {
      const { user } = setup();

      await user.type(getFields().number, '1234');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should refuse a number that fails the Luhn algorithm', async () => {
      const { user } = setup();
      const { number, holder } = getFields();

      await user.type(number, '1234567891011121');
      await user.click(holder);

      expect(screen.getByRole('alert')).toHaveTextContent('Número de cartão inválido.');
      expect(number).toHaveAttribute('aria-invalid', 'true');
    });

    it('should accept a number that passes the Luhn algorithm', async () => {
      const { user } = setup();
      const { number, holder } = getFields();

      await user.type(number, VALID_NUMBER);
      await user.click(holder);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should refuse an expired card', async () => {
      const { user } = setup();
      const { expiry, holder } = getFields();

      await user.type(expiry, '0324');
      await user.click(holder);

      expect(screen.getByRole('alert')).toHaveTextContent('Validade inválida ou cartão vencido.');
    });

    it('should refuse an invalid month', async () => {
      const { user } = setup();
      const { expiry, holder } = getFields();

      await user.type(expiry, '1399');
      await user.click(holder);

      expect(screen.getByRole('alert')).toHaveTextContent('Validade inválida ou cartão vencido.');
    });

    it('should refuse an incomplete CVV', async () => {
      const { user } = setup();
      const { cvv, holder } = getFields();

      await user.type(cvv, '12');
      await user.click(holder);

      expect(screen.getByRole('alert')).toHaveTextContent('O CVV deve ter 3 ou 4 dígitos.');
    });

    it('should accept a CVV with 3 or 4 digits', async () => {
      const { user } = setup();
      const { cvv, holder } = getFields();

      await user.type(cvv, '1234');
      await user.click(holder);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should refuse a holder name with fewer than 3 letters', async () => {
      const { user } = setup();
      const { holder, number } = getFields();

      await user.type(holder, 'a b');
      await user.click(number);

      expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome impresso no cartão.');
    });

    it('should refuse an empty holder name', async () => {
      const { user } = setup();
      const { holder, number } = getFields();

      await user.click(holder);
      await user.click(number);

      expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome impresso no cartão.');
    });
  });

  describe('onChange', () => {
    it('should report an invalid form on mount with a single installment', () => {
      const { onChange } = setup();

      expect(onChange).toHaveBeenLastCalledWith({ isValid: false, installments: 1 });
    });

    it('should report a valid form once every field is valid', async () => {
      const { onChange, user } = setup();

      await fillValidForm(user);

      expect(onChange).toHaveBeenLastCalledWith({ isValid: true, installments: 1 });
    });

    it('should become invalid again when a field turns invalid', async () => {
      const { onChange, user } = setup();
      await fillValidForm(user);

      await user.type(getFields().cvv, '{Backspace}{Backspace}');

      expect(onChange).toHaveBeenLastCalledWith({ isValid: false, installments: 1 });
    });

    it('should expose only isValid and installments, never card data', async () => {
      const { onChange, user } = setup({ maxInstallments: 3 });

      await fillValidForm(user);

      for (const [change] of onChange.mock.calls) {
        expect(Object.keys(change).sort()).toEqual(['installments', 'isValid']);
      }
      expect(JSON.stringify(onChange.mock.calls)).not.toContain(VALID_NUMBER);
    });

    it('should not call onChange again when the parent passes a new callback with the same result', () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<CreditCardForm amount={167} onChange={first} />);

      rerender(<CreditCardForm amount={167} onChange={second} />);

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });
  });

  describe('installments', () => {
    it('should hide the installments field when maxInstallments is 1', () => {
      setup();

      expect(screen.queryByLabelText('Parcelas')).not.toBeInTheDocument();
    });

    it('should list one option per installment up to maxInstallments with the value of each', () => {
      setup({ amount: 600, maxInstallments: 3 });

      const options = screen.getAllByRole('option').map((option) => option.textContent);

      expect(options).toEqual([
        `1x de ${formatCurrency(600)}`,
        `2x de ${formatCurrency(300)}`,
        `3x de ${formatCurrency(200)}`,
      ]);
    });

    it('should report the selected number of installments', async () => {
      const { onChange, user } = setup({ amount: 600, maxInstallments: 3 });

      await user.selectOptions(screen.getByLabelText('Parcelas'), '3');

      expect(onChange).toHaveBeenLastCalledWith({ isValid: false, installments: 3 });
    });

    it('should fall back to the new limit when maxInstallments shrinks', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <CreditCardForm amount={600} maxInstallments={4} onChange={onChange} />,
      );

      await user.selectOptions(screen.getByLabelText('Parcelas'), '4');
      rerender(<CreditCardForm amount={600} maxInstallments={2} onChange={onChange} />);

      expect(onChange).toHaveBeenLastCalledWith({ isValid: false, installments: 2 });
    });
  });
});
