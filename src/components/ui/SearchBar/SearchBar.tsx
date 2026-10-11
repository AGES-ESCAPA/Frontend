import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import styles from './SearchBar.module.css';

export type SearchBarTheme = 'light' | 'dark';

export interface SearchBarProps {
  value: string;
  onChange: (nextValue: string) => void;
  onSearch?: (searchTerm: string) => void;
  placeholder?: string;
  theme?: SearchBarTheme;
  'aria-label'?: string;
}

const DEFAULT_PLACEHOLDER = 'Buscar por nome ou tema';
const DEFAULT_ARIA_LABEL = 'Buscar cursos';
const SEARCH_DEBOUNCE_MS = 300;

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = DEFAULT_PLACEHOLDER,
  theme = 'dark',
  'aria-label': ariaLabel = DEFAULT_ARIA_LABEL,
}: SearchBarProps) => {
  const timeoutRef = useRef<number | null>(null);
  const lastSearchedValueRef = useRef(value);

  // Mantemos onSearch em ref para que o efeito de debounce dependa apenas de
  // `value`. Se `onSearch` entrasse nas dependências, cada re-render do pai com
  // um callback inline reiniciaria o timer — e um pai que re-renderiza a cada
  // menos de 300ms nunca deixaria a busca disparar.
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const cancelPendingSearch = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Só reagimos a mudanças reais do texto: o valor inicial já é conhecido pelo
    // consumidor. Comparar o último valor tratado (em vez de um booleano de
    // montagem) também cobre o StrictMode, que roda o efeito duas vezes na
    // montagem — com um booleano, a segunda execução disparava uma busca extra.
    if (lastSearchedValueRef.current === value) {
      return undefined;
    }

    lastSearchedValueRef.current = value;

    cancelPendingSearch();

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      onSearchRef.current?.(value);
    }, SEARCH_DEBOUNCE_MS);

    return cancelPendingSearch;
  }, [cancelPendingSearch, value]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  // Limpar altera o valor e, portanto, passa pelo mesmo debounce da digitação:
  // o consumidor recebe onSearch('') e consegue restaurar a listagem completa.
  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !onSearchRef.current) {
      return;
    }

    // Confirmação explícita: cancela o debounce pendente para não buscar duas
    // vezes o mesmo termo.
    event.preventDefault();
    cancelPendingSearch();
    onSearchRef.current(value);
  };

  return (
    <div
      className={`${styles.searchBar} ${styles[theme]}`}
      data-theme={theme}
      aria-label={ariaLabel}
    >
      <Search className={styles.searchIcon} size={18} strokeWidth={2} aria-hidden="true" />

      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={styles.input}
      />

      {value.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Limpar busca"
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
};
