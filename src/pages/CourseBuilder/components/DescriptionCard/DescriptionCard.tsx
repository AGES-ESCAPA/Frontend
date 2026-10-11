import { memo, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
} from 'lucide-react';
import { Panel, TextArea } from '@components/ui';
import type { CourseFormField } from '@/types/course';
import styles from './DescriptionCard.module.css';

export interface DescriptionCardProps {
  description: string;
  descriptionError?: string;
  disabled?: boolean;
  onFieldChange: (field: CourseFormField, value: string) => void;
}

interface DescriptionTool {
  id: string;
  label: string;
  icon: ReactNode;
  /** Marcadores inseridos antes e depois do trecho selecionado. */
  wrap: readonly [string, string];
}

const DESCRIPTION_ID = 'course-description';
const TOOLBAR_ICON_SIZE = 16;

const TOOL_GROUPS: readonly (readonly DescriptionTool[])[] = [
  [
    { id: 'bold', label: 'Negrito', icon: <Bold size={TOOLBAR_ICON_SIZE} />, wrap: ['**', '**'] },
    { id: 'italic', label: 'Itálico', icon: <Italic size={TOOLBAR_ICON_SIZE} />, wrap: ['_', '_'] },
    {
      id: 'underline',
      label: 'Sublinhado',
      icon: <Underline size={TOOLBAR_ICON_SIZE} />,
      wrap: ['<u>', '</u>'],
    },
  ],
  [
    {
      id: 'heading-1',
      label: 'Título de nível 1',
      icon: <Heading1 size={TOOLBAR_ICON_SIZE} />,
      wrap: ['# ', ''],
    },
    {
      id: 'heading-2',
      label: 'Título de nível 2',
      icon: <Heading2 size={TOOLBAR_ICON_SIZE} />,
      wrap: ['## ', ''],
    },
    { id: 'quote', label: 'Citação', icon: <Quote size={TOOLBAR_ICON_SIZE} />, wrap: ['> ', ''] },
  ],
  [
    {
      id: 'bullet-list',
      label: 'Lista com marcadores',
      icon: <List size={TOOLBAR_ICON_SIZE} />,
      wrap: ['- ', ''],
    },
    {
      id: 'ordered-list',
      label: 'Lista numerada',
      icon: <ListOrdered size={TOOLBAR_ICON_SIZE} />,
      wrap: ['1. ', ''],
    },
  ],
  [
    {
      id: 'link',
      label: 'Link',
      icon: <Link2 size={TOOLBAR_ICON_SIZE} />,
      wrap: ['[', '](https://)'],
    },
    {
      id: 'image',
      label: 'Imagem',
      icon: <ImageIcon size={TOOLBAR_ICON_SIZE} />,
      wrap: ['![', '](https://)'],
    },
    { id: 'code', label: 'Código', icon: <Code size={TOOLBAR_ICON_SIZE} />, wrap: ['`', '`'] },
  ],
];

const DescriptionCardBase = ({
  description,
  descriptionError,
  disabled = false,
  onFieldChange,
}: DescriptionCardProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<readonly [number, number] | null>(null);

  const applyTool = useCallback(
    (tool: DescriptionTool) => {
      const textarea = textareaRef.current;
      if (textarea === null) return;

      const { selectionStart, selectionEnd } = textarea;
      const [prefix, suffix] = tool.wrap;
      const selected = description.slice(selectionStart, selectionEnd);
      const head = description.slice(0, selectionStart);
      const tail = description.slice(selectionEnd);

      pendingSelectionRef.current = [
        selectionStart + prefix.length,
        selectionStart + prefix.length + selected.length,
      ];

      onFieldChange('description', `${head}${prefix}${selected}${suffix}${tail}`);
    },
    [description, onFieldChange],
  );

  // O texto é reescrito pelo React, então a seleção só pode ser restaurada
  // depois que o novo valor chega ao DOM — caso contrário o cursor volta ao fim.
  useEffect(() => {
    const pending = pendingSelectionRef.current;
    if (pending === null) return;

    pendingSelectionRef.current = null;
    const textarea = textareaRef.current;
    if (textarea === null) return;

    textarea.focus();
    textarea.setSelectionRange(pending[0], pending[1]);
  }, [description]);

  return (
    <Panel className={styles.card}>
      <label className={styles.label} htmlFor={DESCRIPTION_ID}>
        Descrição Completa
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      </label>

      <div className={styles.toolbar} role="toolbar" aria-label="Formatação da descrição">
        {TOOL_GROUPS.map((group) => (
          <div key={group[0].id} className={styles.toolGroup}>
            {group.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={styles.tool}
                title={tool.label}
                aria-label={tool.label}
                disabled={disabled}
                onClick={() => applyTool(tool)}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.editor}>
        <TextArea
          ref={textareaRef}
          id={DESCRIPTION_ID}
          className={styles.textarea}
          value={description}
          required
          disabled={disabled}
          invalid={descriptionError !== undefined}
          onChange={(event) => onFieldChange('description', event.target.value)}
        />

        {descriptionError === undefined ? null : (
          <p className={styles.error} role="alert">
            {descriptionError}
          </p>
        )}
      </div>
    </Panel>
  );
};

export const DescriptionCard = memo(DescriptionCardBase);
