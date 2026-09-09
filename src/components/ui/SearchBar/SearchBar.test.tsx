import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { SearchBar } from './SearchBar.tsx';

const ControlledSearchBar = ({
  onSearch,
  initialValue = '',
}: {
  onSearch?: (value: string) => void;
  initialValue?: string;
}) => {
  const [value, setValue] = useState(initialValue);

  return (
    <SearchBar value={value} onChange={setValue} onSearch={onSearch} aria-label="Buscar cursos" />
  );
};

describe('SearchBar', () => {
  it('should call onChange for each typed character and trigger onSearch with debounce', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<ControlledSearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox', { name: /buscar cursos/i });
    await user.type(input, 'java');

    expect(input).toHaveValue('java');

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('java');
      },
      { timeout: 1000 },
    );
  });

  it('should render a clear button when the field has content and clear the value', async () => {
    const user = userEvent.setup();

    render(<ControlledSearchBar initialValue="react" />);

    const clearButton = screen.getByRole('button', { name: /limpar busca/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(screen.getByRole('textbox', { name: /buscar cursos/i })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /limpar busca/i })).not.toBeInTheDocument();
  });

  it('should default to dark theme and placeholder', () => {
    render(<ControlledSearchBar />);

    const input = screen.getByRole('textbox', { name: /buscar cursos/i });
    expect(input).toHaveAttribute('placeholder', 'Buscar por nome ou tema');
    expect(input.closest('div')).toHaveClass('dark');
  });
});
