import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import styles from './CategoryCombobox.module.css';

export interface CategoryComboboxProps {
  id: string;
  value: string;
  categories: readonly string[];
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}

interface CategoryOption {
  kind: 'existing' | 'create';
  label: string;
}

const SEARCH_PLACEHOLDER = 'Buscar categoria';

const normalizeCategory = (value: string): string => value.trim().toLocaleLowerCase('pt-BR');

const matchesCategory = (category: string, query: string): boolean =>
  category.toLocaleLowerCase('pt-BR').includes(normalizeCategory(query));

const createOptionLabel = (name: string): string => `Criar categoria "${name}"`;

const mergeCategories = (
  fromDatabase: readonly string[],
  created: readonly string[],
  current: string,
): string[] => {
  const unique = new Map<string, string>();

  const add = (name: string) => {
    const trimmed = name.trim();
    if (trimmed === '') return;
    const key = normalizeCategory(trimmed);
    if (!unique.has(key)) unique.set(key, trimmed);
  };

  fromDatabase.forEach(add);
  created.forEach(add);
  add(current);

  return [...unique.values()].sort((left, right) => left.localeCompare(right, 'pt-BR'));
};

export const CategoryCombobox = ({
  id,
  value,
  categories,
  isLoading = false,
  placeholder = 'Selecione uma categoria',
  disabled = false,
  invalid = false,
  required = false,
  onChange,
}: CategoryComboboxProps) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeOptionRef = useRef<HTMLLIElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [createdCategories, setCreatedCategories] = useState<string[]>([]);

  const trimmedQuery = query.trim();
  const mergedCategories = useMemo(
    () => mergeCategories(categories, createdCategories, value),
    [categories, createdCategories, value],
  );

  const visibleCategories = useMemo(() => {
    if (trimmedQuery === '') return mergedCategories;
    return mergedCategories.filter((category) => matchesCategory(category, trimmedQuery));
  }, [mergedCategories, trimmedQuery]);

  const canCreate =
    trimmedQuery !== '' &&
    !mergedCategories.some(
      (category) => normalizeCategory(category) === normalizeCategory(trimmedQuery),
    );

  const options = useMemo<CategoryOption[]>(() => {
    const existing = visibleCategories.map((label): CategoryOption => ({
      kind: 'existing',
      label,
    }));
    if (!canCreate) return existing;
    return [...existing, { kind: 'create', label: trimmedQuery }];
  }, [canCreate, trimmedQuery, visibleCategories]);

  const safeIndex = options.length === 0 ? 0 : Math.min(activeIndex, options.length - 1);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    const selectedIndex = mergedCategories.findIndex(
      (category) => normalizeCategory(category) === normalizeCategory(value),
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setQuery('');
    setIsOpen(true);
  }, [disabled, mergedCategories, value]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof activeOptionRef.current?.scrollIntoView !== 'function') return;
    activeOptionRef.current.scrollIntoView({ block: 'nearest' });
  }, [isOpen, safeIndex]);

  const selectOption = (option: CategoryOption) => {
    if (option.kind === 'create') {
      setCreatedCategories((current) =>
        current.some((category) => normalizeCategory(category) === normalizeCategory(option.label))
          ? current
          : [...current, option.label],
      );
    }
    onChange(option.label);
    close();
    triggerRef.current?.focus();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (options.length === 0) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        const bounded = Math.min(current, options.length - 1);
        const next = bounded + direction;
        if (next < 0) return options.length - 1;
        if (next >= options.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[safeIndex];
      if (option !== undefined) selectOption(option);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    }
  };

  const showEmpty = options.length === 0 && (isLoading || trimmedQuery === '');

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={styles.trigger}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-busy={isLoading || undefined}
        data-invalid={invalid}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            open();
          }
        }}
      >
        <span className={value.trim() === '' ? styles.placeholder : styles.value}>
          {value.trim() === '' ? placeholder : value}
        </span>
        <ChevronDown className={styles.chevron} size={18} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className={styles.menu}>
          <div className={styles.search}>
            <Search className={styles.searchIcon} size={16} aria-hidden="true" />
            <input
              ref={inputRef}
              className={styles.searchInput}
              type="text"
              role="searchbox"
              value={query}
              placeholder={SEARCH_PLACEHOLDER}
              aria-label={SEARCH_PLACEHOLDER}
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={
                options[safeIndex] !== undefined ? `${listId}-${safeIndex}` : undefined
              }
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <ul id={listId} className={styles.list} role="listbox" aria-label="Categorias">
            {options.map((option, index) => {
              const isActive = index === safeIndex;
              const isSelected =
                option.kind === 'existing' &&
                normalizeCategory(option.label) === normalizeCategory(value);
              const className = [styles.option, option.kind === 'create' ? styles.create : '']
                .filter(Boolean)
                .join(' ');

              return (
                <li
                  key={option.kind === 'create' ? `create-${option.label}` : option.label}
                  id={`${listId}-${index}`}
                  ref={isActive ? activeOptionRef : undefined}
                  role="option"
                  className={className}
                  aria-selected={isSelected}
                  data-active={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {option.kind === 'create' ? (
                    <>
                      <Plus size={16} aria-hidden="true" />
                      {createOptionLabel(option.label)}
                    </>
                  ) : (
                    option.label
                  )}
                </li>
              );
            })}

            {showEmpty ? (
              <li className={styles.empty} role="presentation">
                {isLoading ? 'Carregando categorias…' : 'Nenhuma categoria cadastrada'}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
