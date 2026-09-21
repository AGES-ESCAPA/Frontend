import { History } from 'lucide-react';
import { Checkbox, Panel } from '@components/ui';
import type { CourseVersionLogEntry } from '@/types/course';
import styles from './VersionControlCard.module.css';

export interface VersionControlCardProps {
  versionLabel: string;
  entries: CourseVersionLogEntry[];
  notifyStudentsOnPublish: boolean;
  disabled?: boolean;
  onNotifyStudentsOnPublishChange: (value: boolean) => void;
}

export const VersionControlCard = ({
  versionLabel,
  entries,
  notifyStudentsOnPublish,
  disabled = false,
  onNotifyStudentsOnPublishChange,
}: VersionControlCardProps) => (
  <Panel
    title="Controle de Versão"
    icon={<History size={22} />}
    actions={<span className={styles.versionTag}>{versionLabel}</span>}
  >
    <ol className={styles.timeline}>
      {entries.map((entry, index) => (
        <li key={entry.id} className={styles.entry} data-latest={index === 0}>
          <p className={styles.timestamp}>{entry.timestampLabel}</p>
          <p className={styles.description}>{entry.description}</p>
          <p className={styles.author}>Por: {entry.author}</p>
        </li>
      ))}
    </ol>

    <div className={styles.notifyRow}>
      <Checkbox
        label="Notificar todos os alunos matriculados sobre nova versão ao publicar"
        checked={notifyStudentsOnPublish}
        disabled={disabled}
        onChange={(event) => onNotifyStudentsOnPublishChange(event.target.checked)}
      />
    </div>
  </Panel>
);
