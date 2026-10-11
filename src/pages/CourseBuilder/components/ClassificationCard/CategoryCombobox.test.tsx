import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCombobox } from './CategoryCombobox';

const CATEGORIES = ['Hospitalidade', 'Inteligência Artificial', 'Marketing'];

const ControlledCombobox = ({
  categories = CATEGORIES,
  onChange,
}: {
  categories?: readonly string[];
  onChange?: (value: string) => void;
}) => {
  const [value, setValue] = useState('');

  return (
    <CategoryCombobox
      id="course-category"
      value={value}
      categories={categories}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

describe('CategoryCombobox', () => {
  it('should list only the categories received from the caller', async () => {
    render(<ControlledCombobox />);

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'Hospitalidade' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inteligência Artificial' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Marketing' })).toBeInTheDocument();
  });

  it('should filter categories without considering letter case', async () => {
    render(<ControlledCombobox />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('searchbox', { name: /buscar categoria/i }), 'market');

    expect(screen.getByRole('option', { name: 'Marketing' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Hospitalidade' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Criar categoria "market"' })).toBeInTheDocument();
  });

  it('should select the registered spelling when the search matches ignoring case', async () => {
    const onChange = vi.fn();
    render(<ControlledCombobox onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(
      screen.getByRole('searchbox', { name: /buscar categoria/i }),
      'HOSPITALIDADE',
    );
    await userEvent.click(screen.getByRole('option', { name: 'Hospitalidade' }));

    expect(onChange).toHaveBeenCalledWith('Hospitalidade');
    expect(screen.queryByRole('option', { name: /criar categoria/i })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Hospitalidade');
  });

  it('should create a category when the search does not match a registered name', async () => {
    const onChange = vi.fn();
    render(<ControlledCombobox onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(
      screen.getByRole('searchbox', { name: /buscar categoria/i }),
      '  Enoturismo  ',
    );
    await userEvent.click(screen.getByRole('option', { name: 'Criar categoria "Enoturismo"' }));

    expect(onChange).toHaveBeenCalledWith('Enoturismo');
    expect(screen.getByRole('combobox')).toHaveTextContent('Enoturismo');

    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Enoturismo' })).toBeInTheDocument();
  });

  it('should hide the create action when the typed name already exists ignoring case', async () => {
    render(<ControlledCombobox />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('searchbox', { name: /buscar categoria/i }), 'marketing');

    expect(screen.getByRole('option', { name: 'Marketing' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /criar categoria/i })).not.toBeInTheDocument();
  });
});
