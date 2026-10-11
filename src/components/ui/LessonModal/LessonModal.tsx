import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import type { Lesson, LessonPayload, LessonResourceType } from '@/types/lesson';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { Switch } from '../Switch';
import { DurationInput } from './DurationInput';
import { FileInputButton } from './FileInputButton';
import { FormField } from './FormField';
import { LessonResources } from './LessonResources';
import { LessonTypeSelector } from './LessonTypeSelector';
import type { LessonFormErrors, LessonFormState, LessonResourceDraft } from './lessonForm';
import {
  EMPTY_LESSON_FORM_ERRORS,
  buildLessonPayload,
  createLessonFormState,
  createResourceDraft,
  hasLessonFormErrors,
  validateLessonForm,
} from './lessonForm';
import { getLessonTypeIcon } from './lessonTypeOptions';
import styles from './LessonModal.module.css';

const GENERIC_SUBMIT_ERROR = 'Não foi possível salvar a aula. Tente novamente.';

export interface LessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Módulo que receberá a aula. */
  moduleId: string;
  moduleName: string;
  /** Posição do módulo na estrutura do curso, exibida no cabeçalho. */
  moduleOrder?: number;
  /** Aula existente: presente apenas no modo de edição. */
  lesson?: Lesson | null;
  /**
   * Persiste a aula. O modal fecha quando a promessa resolve e mantém o
   * formulário aberto, com a mensagem de erro, quando ela rejeita.
   */
  onSubmit: (payload: LessonPayload) => Promise<void> | void;
}

export const LessonModal = ({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  moduleOrder,
  lesson,
  onSubmit,
}: LessonModalProps) => {
  const [form, setForm] = useState<LessonFormState>(() => createLessonFormState(lesson));
  const [errors, setErrors] = useState<LessonFormErrors>(EMPTY_LESSON_FORM_ERRORS);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const baseId = useId();
  const titleId = `${baseId}-title`;
  const typeLabelId = `${baseId}-type`;
  const videoUrlId = `${baseId}-video-url`;
  const durationId = `${baseId}-duration`;
  const textContentId = `${baseId}-text-content`;
  const fileUrlId = `${baseId}-file-url`;
  const descriptionId = `${baseId}-description`;
  const freeSampleLabelId = `${baseId}-free-sample-label`;
  const freeSampleHintId = `${baseId}-free-sample-hint`;

  const isEditing = Boolean(lesson);
  const HeaderIcon = getLessonTypeIcon(form.type);

  // Mantemos a aula em ref para que o efeito de carga dependa só do `id`. Com o
  // objeto nas dependências, um pai que recria `lesson` a cada render (por
  // exemplo com um `find` inline) apagaria o que o administrador digitou.
  const lessonRef = useRef(lesson);

  useEffect(() => {
    lessonRef.current = lesson;
  });

  // Cada abertura recomeça do zero (criação) ou dos dados salvos (edição).
  useEffect(() => {
    if (!open) return;

    setForm(createLessonFormState(lessonRef.current));
    setErrors(EMPTY_LESSON_FORM_ERRORS);
    setWasSubmitted(false);
    setSubmitError(null);
    setIsSaving(false);
  }, [open, lesson?.id]);

  // Depois da primeira tentativa de salvar, o retorno passa a ser imediato.
  useEffect(() => {
    if (!wasSubmitted) return;

    setErrors(validateLessonForm(form));
  }, [form, wasSubmitted]);

  const updateForm = (patch: Partial<LessonFormState>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  };

  const handleAddResource = (type: LessonResourceType) => {
    setForm((previous) => ({
      ...previous,
      resources: [...previous.resources, createResourceDraft(type)],
    }));
  };

  const handleChangeResource = (id: string, patch: Partial<LessonResourceDraft>) => {
    setForm((previous) => ({
      ...previous,
      resources: previous.resources.map((resource) =>
        resource.id === id ? { ...resource, ...patch } : resource,
      ),
    }));
  };

  const handleRemoveResource = (id: string) => {
    setForm((previous) => ({
      ...previous,
      resources: previous.resources.filter((resource) => resource.id !== id),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasSubmitted(true);

    const validation = validateLessonForm(form);
    setErrors(validation);
    if (hasLessonFormErrors(validation)) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      await onSubmit(buildLessonPayload(form, moduleId));
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : GENERIC_SUBMIT_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = (error?: string) => `${styles.input} ${error ? styles.inputInvalid : ''}`;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEditing ? 'Editar Aula' : 'Adicionar Aula'}
      subtitle={moduleOrder ? `Módulo ${moduleOrder} · ${moduleName}` : moduleName}
      icon={<HeaderIcon size={20} strokeWidth={2} aria-hidden="true" />}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button
            type="button"
            label="Cancelar"
            variant="secondary"
            className={styles.footerButton}
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          />
          <Button
            type="submit"
            label={isEditing ? 'Salvar Alterações' : 'Salvar Aula'}
            variant="primary"
            className={`${styles.footerButton} ${styles.saveButton}`}
            isLoading={isSaving}
          />
        </>
      }
    >
      {submitError ? (
        <p className={styles.submitError} role="alert">
          <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
          {submitError}
        </p>
      ) : null}

      <FormField id={titleId} label="Título da aula" required error={errors.title}>
        <input
          id={titleId}
          type="text"
          className={inputClassName(errors.title)}
          placeholder="Ex.: 1.3 Formulários e Validação em HTML"
          value={form.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          aria-required="true"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${titleId}-error` : undefined}
        />
      </FormField>

      <LessonTypeSelector
        name={`${baseId}-lesson-type`}
        labelId={typeLabelId}
        value={form.type}
        onChange={(type) => updateForm({ type })}
      />

      {form.type === 'video' ? (
        <div className={styles.row}>
          <FormField id={videoUrlId} label="URL do vídeo" required error={errors.videoUrl}>
            <input
              id={videoUrlId}
              type="url"
              className={inputClassName(errors.videoUrl)}
              placeholder="https://youtube.com..."
              value={form.videoUrl}
              onChange={(event) => updateForm({ videoUrl: event.target.value })}
              aria-required="true"
              aria-invalid={Boolean(errors.videoUrl)}
              aria-describedby={errors.videoUrl ? `${videoUrlId}-error` : undefined}
            />
          </FormField>

          <FormField id={durationId} label="Duração" error={errors.duration}>
            <DurationInput
              id={durationId}
              className={inputClassName(errors.duration)}
              value={form.duration}
              onChange={(duration) => updateForm({ duration })}
              aria-invalid={Boolean(errors.duration)}
              aria-describedby={errors.duration ? `${durationId}-error` : undefined}
            />
          </FormField>
        </div>
      ) : null}

      {form.type === 'text' ? (
        <FormField
          id={textContentId}
          label="Conteúdo da aula"
          required
          error={errors.textContent}
          hint="Texto explicativo que o aluno lê no lugar do vídeo."
        >
          <textarea
            id={textContentId}
            className={`${inputClassName(errors.textContent)} ${styles.textareaLarge}`}
            placeholder="Escreva o artigo da aula..."
            value={form.textContent}
            onChange={(event) => updateForm({ textContent: event.target.value })}
            aria-required="true"
            aria-invalid={Boolean(errors.textContent)}
            aria-describedby={errors.textContent ? `${textContentId}-error` : undefined}
          />
        </FormField>
      ) : null}

      {form.type === 'file' ? (
        <FormField
          id={fileUrlId}
          label="Arquivo da aula"
          required
          error={errors.fileUrl}
          hint="Envie um PDF ou planilha, ou informe a URL pública do material."
        >
          <div className={styles.fileRow}>
            <FileInputButton
              id={`${baseId}-lesson-file`}
              file={form.file}
              onSelect={(file) => updateForm({ file })}
            />
            <input
              id={fileUrlId}
              type="url"
              className={inputClassName(errors.fileUrl)}
              placeholder="https://.../material.pdf"
              value={form.fileUrl}
              onChange={(event) => updateForm({ fileUrl: event.target.value })}
              aria-invalid={Boolean(errors.fileUrl)}
              aria-describedby={errors.fileUrl ? `${fileUrlId}-error` : undefined}
            />
          </div>
        </FormField>
      ) : null}

      <FormField id={descriptionId} label="Descrição para os alunos" optional>
        <textarea
          id={descriptionId}
          className={`${styles.input} ${styles.textarea}`}
          placeholder="Resuma o que o aluno vai aprender nesta aula."
          value={form.description}
          onChange={(event) => updateForm({ description: event.target.value })}
        />
      </FormField>

      <LessonResources
        idPrefix={`${baseId}-resources`}
        resources={form.resources}
        errors={errors.resources}
        onAdd={handleAddResource}
        onChange={handleChangeResource}
        onRemove={handleRemoveResource}
      />

      <div className={styles.toggleCard}>
        <div className={styles.toggleTexts}>
          <span className={styles.toggleTitle} id={freeSampleLabelId}>
            Aula de amostra gratuita
          </span>
          <span className={styles.toggleHint} id={freeSampleHintId}>
            Alunos não matriculados poderão assistir esta aula.
          </span>
        </div>

        <Switch
          checked={form.isFreeSample}
          onCheckedChange={(isFreeSample) => updateForm({ isFreeSample })}
          aria-labelledby={freeSampleLabelId}
          aria-describedby={freeSampleHintId}
        />
      </div>
    </Modal>
  );
};
