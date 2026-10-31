import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { FormField } from '@components/ui';
import { uploadCourseThumbnail } from '@services/courseService';
import styles from './CoverImageField.module.css';

const COVER_INPUT_ID = 'course-cover-image';
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export interface CoverImageFieldProps {
  thumbnailUrl: string;
  disabled?: boolean;
  onChange: (thumbnailUrl: string) => void;
  /** `true` quando um envio começa e `false` quando termina, mesmo se o campo desmontar. */
  onUploadingChange: (uploading: boolean) => void;
}

export const CoverImageField = ({
  thumbnailUrl,
  disabled = false,
  onChange,
  onUploadingChange,
}: CoverImageFieldProps) => {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const replacePreview = (next: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = next;
    setLocalPreview(next);
  };

  const shownUrl = localPreview ?? (thumbnailUrl.trim() === '' ? null : thumbnailUrl);
  const isDisabled = disabled || isUploading;

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setErrorMessage(null);
    replacePreview(null);
    onChange('');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage('Use uma imagem JPEG, PNG ou WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setErrorMessage(null);
    replacePreview(URL.createObjectURL(file));
    setIsUploading(true);
    onUploadingChange(true);

    void uploadCourseThumbnail(file)
      .then((url) => {
        onChange(url);
        if (aliveRef.current) replacePreview(null);
      })
      .catch((error: unknown) => {
        if (!aliveRef.current) return;
        replacePreview(null);
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível enviar a imagem de capa.',
        );
      })
      .finally(() => {
        onUploadingChange(false);
        if (aliveRef.current) setIsUploading(false);
      });
  };

  return (
    <FormField
      className={styles.field}
      label="Imagem de capa"
      htmlFor={COVER_INPUT_ID}
      hint="JPEG, PNG ou WEBP, até 5 MB."
      error={errorMessage ?? undefined}
    >
      <div className={styles.cover}>
        <div className={styles.frame}>
          <button
            type="button"
            className={styles.zone}
            disabled={isDisabled}
            aria-busy={isUploading}
            onClick={openPicker}
          >
            {shownUrl === null ? (
              <span className={styles.placeholder}>
                <ImagePlus size={20} aria-hidden="true" />
                Clique para enviar a capa
              </span>
            ) : (
              <>
                <img
                  className={styles.preview}
                  src={shownUrl}
                  alt="Pré-visualização da capa do curso"
                />
                <span className={styles.overlay}>
                  {isUploading ? 'Enviando imagem…' : 'Trocar imagem'}
                </span>
              </>
            )}
          </button>

          {shownUrl === null ? null : (
            <button
              type="button"
              className={styles.remove}
              aria-label="Remover capa"
              disabled={isDisabled}
              onClick={handleRemove}
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          id={COVER_INPUT_ID}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          className={styles.input}
          disabled={isDisabled}
          onChange={handleFileChange}
        />

        {isUploading ? (
          <p className={styles.status} role="status">
            Enviando imagem…
          </p>
        ) : null}
      </div>
    </FormField>
  );
};
