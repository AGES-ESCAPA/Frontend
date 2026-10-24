import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { Avatar } from '@components/ui/Avatar/Avatar';
import { Button } from '@components/ui/Button';
import type { AvatarUploadProps } from './AvatarUploadProps';
import styles from './AvatarUpload.module.css';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;
const MAX_FILE_SIZE_BYTES = 2 * MEGABYTE;

/** Limite legível para a mensagem de erro: "2 MB", "0,1 MB" ou, abaixo de 100 KB, "50 KB". */
const formatFileSize = (bytes: number): string =>
  bytes >= 100 * KILOBYTE
    ? `${(bytes / MEGABYTE).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
    : `${Math.round(bytes / KILOBYTE)} KB`;

export const AvatarUpload = ({
  imageUrl,
  name,
  onFileSelected,
  maxSizeBytes = MAX_FILE_SIZE_BYTES,
}: AvatarUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewUrl) return;

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage(
        'Tipo de arquivo não permitido. Por favor, selecione uma imagem JPEG, PNG ou WEBP.',
      );
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrorMessage(`A imagem deve ter no máximo ${formatFileSize(maxSizeBytes)}.`);
      return;
    }
    setErrorMessage(null);

    const newPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl(newPreviewUrl);
    onFileSelected(file);
  };

  return (
    <div className={styles.root}>
      <Avatar imageUrl={previewUrl ?? imageUrl ?? undefined} name={name} theme="dark" size="lg" />
      {errorMessage && (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}
      <input
        ref={fileInputRef}
        data-testid="avatar-file-input"
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        className={styles.input}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="secondary"
        label="Alterar foto"
        icon={<Camera size={18} />}
        onClick={handleButtonClick}
      />
    </div>
  );
};
