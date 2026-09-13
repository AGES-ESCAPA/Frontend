import { Link2, Paperclip, Plus, Trash2 } from 'lucide-react';
import type { LessonResourceType } from '@/types/lesson';
import { Button } from '../Button';
import { FileInputButton } from './FileInputButton';
import type { LessonResourceDraft, LessonResourceErrors } from './lessonForm';
import styles from './LessonModal.module.css';

export interface LessonResourcesProps {
  /** Prefixo dos `id` gerados para os campos de cada material. */
  idPrefix: string;
  resources: LessonResourceDraft[];
  errors: Record<string, LessonResourceErrors>;
  onAdd: (type: LessonResourceType) => void;
  onChange: (id: string, patch: Partial<LessonResourceDraft>) => void;
  onRemove: (id: string) => void;
}

export const LessonResources = ({
  idPrefix,
  resources,
  errors,
  onAdd,
  onChange,
  onRemove,
}: LessonResourcesProps) => (
  <section className={styles.resources} aria-labelledby={`${idPrefix}-heading`}>
    <div className={styles.resourcesHeader}>
      <div className={styles.resourcesHeadings}>
        <h3 className={styles.resourcesTitle} id={`${idPrefix}-heading`}>
          Materiais complementares
        </h3>
        <p className={styles.resourcesHint}>
          Anexe artigos, postagens e arquivos em PDF ou planilha que apoiam a aula.
        </p>
      </div>

      <div className={styles.resourcesActions}>
        <Button
          type="button"
          label="Adicionar link"
          variant="outlined"
          icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />}
          className={styles.smallButton}
          onClick={() => onAdd('link')}
        />
        <Button
          type="button"
          label="Adicionar arquivo"
          variant="outlined"
          icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />}
          className={styles.smallButton}
          onClick={() => onAdd('file')}
        />
      </div>
    </div>

    {resources.length === 0 ? (
      <p className={styles.resourcesEmpty}>
        Nenhum material anexado. Os alunos verão apenas o conteúdo principal da aula.
      </p>
    ) : (
      <ul className={styles.resourceList}>
        {resources.map((resource, index) => {
          const titleId = `${idPrefix}-${resource.id}-title`;
          const urlId = `${idPrefix}-${resource.id}-url`;
          const fileId = `${idPrefix}-${resource.id}-file`;
          const resourceErrors = errors[resource.id];
          const position = index + 1;
          const isLink = resource.type === 'link';

          return (
            <li className={styles.resourceItem} key={resource.id}>
              <span className={styles.resourceKind} aria-hidden="true">
                {isLink ? (
                  <Link2 size={16} strokeWidth={2} />
                ) : (
                  <Paperclip size={16} strokeWidth={2} />
                )}
              </span>

              <div className={styles.resourceFields}>
                <div className={styles.resourceField}>
                  <label className={styles.srOnly} htmlFor={titleId}>
                    {`Título do material ${position}`}
                  </label>
                  <input
                    id={titleId}
                    type="text"
                    className={`${styles.input} ${resourceErrors?.title ? styles.inputInvalid : ''}`}
                    placeholder="Título do material"
                    value={resource.title}
                    onChange={(event) => onChange(resource.id, { title: event.target.value })}
                    aria-invalid={Boolean(resourceErrors?.title)}
                    aria-describedby={resourceErrors?.title ? `${titleId}-error` : undefined}
                  />
                  {resourceErrors?.title ? (
                    <p className={styles.error} id={`${titleId}-error`} role="alert">
                      {resourceErrors.title}
                    </p>
                  ) : null}
                </div>

                <div className={styles.resourceField}>
                  <label className={styles.srOnly} htmlFor={urlId}>
                    {isLink ? `Link do material ${position}` : `URL do arquivo ${position}`}
                  </label>
                  <input
                    id={urlId}
                    type="url"
                    className={`${styles.input} ${resourceErrors?.url ? styles.inputInvalid : ''}`}
                    placeholder={isLink ? 'https://artigo.com/...' : 'https://.../material.pdf'}
                    value={resource.url}
                    onChange={(event) => onChange(resource.id, { url: event.target.value })}
                    aria-invalid={Boolean(resourceErrors?.url)}
                    aria-describedby={resourceErrors?.url ? `${urlId}-error` : undefined}
                  />
                  {resourceErrors?.url ? (
                    <p className={styles.error} id={`${urlId}-error`} role="alert">
                      {resourceErrors.url}
                    </p>
                  ) : null}

                  {isLink ? null : (
                    <FileInputButton
                      id={fileId}
                      file={resource.file}
                      label={`Selecionar arquivo ${position}`}
                      onSelect={(file) => onChange(resource.id, { file })}
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onRemove(resource.id)}
                aria-label={`Remover material ${resource.title.trim() || position}`}
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);
