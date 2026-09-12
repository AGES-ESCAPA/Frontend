import * as Tabs from '@radix-ui/react-tabs';
import styles from './FilterTabs.module.css';

export type FilterTabsVariant = 'outlined' | 'ghost-dark';

export interface FilterTabsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  variant?: FilterTabsVariant;
  groupLabel?: string;
}

export function FilterTabs({
  options,
  selected,
  onChange,
  variant = 'outlined',
  groupLabel,
}: FilterTabsProps) {
  const variantClass = variant === 'ghost-dark' ? styles.ghostDark : styles.outlined;

  return (
    <Tabs.Root
      value={selected}
      onValueChange={onChange}
      className={`${styles.root} ${variantClass}`}
      data-variant={variant}
    >
      <Tabs.List className={styles.list} aria-label={groupLabel}>
        {options.map((option) => (
          <Tabs.Trigger key={option} value={option} className={styles.trigger}>
            {option}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

export default FilterTabs;
