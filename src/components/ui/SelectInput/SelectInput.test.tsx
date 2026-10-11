import { render, screen } from '@testing-library/react';
import { SelectInput } from './SelectInput';

const OPTIONS = [
  { value: 'design', label: 'Design & UX' },
  { value: 'marketing', label: 'Marketing' },
];

describe('SelectInput', () => {
  it('should render every option plus the placeholder', () => {
    render(
      <SelectInput
        options={OPTIONS}
        placeholder="Selecione uma categoria"
        value=""
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('option', { name: 'Selecione uma categoria' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Design & UX' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Marketing' })).toBeInTheDocument();
  });

  it('should keep the placeholder option disabled so it cannot be reselected', () => {
    render(
      <SelectInput
        options={OPTIONS}
        placeholder="Selecione uma categoria"
        value=""
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('option', { name: 'Selecione uma categoria' })).toBeDisabled();
  });

  it('should show the selected option as the current value', () => {
    render(
      <SelectInput
        options={OPTIONS}
        placeholder="Selecione uma categoria"
        value="marketing"
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveValue('marketing');
  });
});
