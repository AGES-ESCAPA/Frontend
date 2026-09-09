import { Search, X } from 'lucide-react';
import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
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

  useEffect(() => {
    if (!onSearch || value === '') {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return undefined;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      onSearch(value);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [onSearch, value]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSearch) {
      event.preventDefault();
      onSearch(value);
    }
  };

  return (
    <div
      className={`${styles.searchBar} ${styles[theme]} ${theme}`}
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
