import type { ChangeEvent } from 'react';
import { Paperclip, X } from 'lucide-react';
import styles from './LessonModal.module.css';

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv';

export interface FileInputButtonProps {
  id: string;
  file: File | null;
  onSelect: (file: File | null) => void;
  label?: string;
  accept?: string;
}

export const FileInputButton = ({
  id,
  file,
  onSelect,
  label = 'Selecionar arquivo',
  accept = DEFAULT_ACCEPT,
}: FileInputButtonProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelect(event.target.files?.[0] ?? null);
  };

  return (
    <div className={styles.filePicker}>
      <label className={styles.filePickerButton} htmlFor={id}>
        <Paperclip size={16} strokeWidth={2} aria-hidden="true" />
        <span className={styles.filePickerText}>{file ? file.name : label}</span>
      </label>

      <input
        id={id}
        type="file"
        accept={accept}
        className={styles.srOnly}
        onChange={handleChange}
      />

      {file ? (
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onSelect(null)}
          aria-label={`Remover arquivo ${file.name}`}
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
};
