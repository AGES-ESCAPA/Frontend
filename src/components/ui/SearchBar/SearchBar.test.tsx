import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useEffect, useState } from 'react';
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

// Pai que re-renderiza mais rápido que o debounce, sempre com callback inline —
// o cenário que reiniciava o timer indefinidamente.
const RerenderingParent = ({ onSearch }: { onSearch: (value: string) => void }) => {
  const [value, setValue] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((tick) => tick + 1), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <SearchBar
      value={value}
      onChange={setValue}
      onSearch={(term) => onSearch(term)}
      aria-label="Buscar cursos"
    />
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
    expect(input.closest('div')).toHaveAttribute('data-theme', 'dark');
  });

  it('should trigger onSearch only once on Enter, cancelling the pending debounce', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<ControlledSearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('textbox', { name: /buscar cursos/i }), 'java{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('java');

    // Passado o tempo do debounce, o timer pendente não pode ressuscitar a busca.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('java');
  });

  it('should trigger onSearch with an empty term when the field is cleared', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<ControlledSearchBar onSearch={onSearch} initialValue="react" />);

    // Nada é buscado na montagem: o consumidor já conhece o valor inicial.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(onSearch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /limpar busca/i }));

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('');
      },
      { timeout: 1000 },
    );
  });

  it('should still debounce when the parent re-renders with an inline onSearch', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<RerenderingParent onSearch={onSearch} />);

    await user.type(screen.getByRole('textbox', { name: /buscar cursos/i }), 'ia');

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('ia');
      },
      { timeout: 1500 },
    );
  });
  it('should not trigger onSearch on mount, even under StrictMode', async () => {
    const onSearch = vi.fn();

    render(
      <StrictMode>
        <ControlledSearchBar onSearch={onSearch} initialValue="react" />
      </StrictMode>,
    );

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
