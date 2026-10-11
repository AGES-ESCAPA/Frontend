import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('should render the label and children', () => {
    render(
      <FormField label="Preço Base">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Preço Base')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show only the hint when there is no error', () => {
    render(
      <FormField label="Preço Base" hint="Aplica-se apenas a contratações avulsas.">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Aplica-se apenas a contratações avulsas.')).toBeInTheDocument();
  });

  it('should keep the hint visible alongside the error', () => {
    render(
      <FormField
        label="Preço Base"
        hint="Aplica-se apenas a contratações avulsas."
        error="Informe um preço maior que zero."
      >
        <input />
      </FormField>,
    );
    expect(screen.getByText('Aplica-se apenas a contratações avulsas.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
  });

  it('should render the error with an alert role', () => {
    render(
      <FormField label="Preço Base" error="Informe um preço maior que zero.">
        <input />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um preço maior que zero.');
  });
});
