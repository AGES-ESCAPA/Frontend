import * as Tabs from '@radix-ui/react-tabs';
import styles from './FilterTabs.module.css';

export interface FilterTabsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;

  groupLabel?: string;
}

export default function FilterTabs({ options, selected, onChange, groupLabel }: FilterTabsProps) {
  return (
    <Tabs.Root value={selected} onValueChange={onChange} className={styles.root}>
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
