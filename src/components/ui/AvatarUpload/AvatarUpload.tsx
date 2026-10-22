import React, { useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Avatar } from '@components/ui/Avatar/Avatar';
import { Button } from '@components/ui/Button';
import type { AvatarUploadProps } from './AvatarUploadProps';
import styles from './AvatarUpload.module.css';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const AvatarUpload = ({
  imageUrl,
  name,
  onFileSelected,
  maxSizeBytes = MAX_FILE_SIZE_BYTES,
}: AvatarUploadProps) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewUrl) return;

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);

      setErrorMessage(
        `Arquivo muito grande. Por favor, selecione uma imagem menor que ${maxSizeMB}MB.`,
      );
      return;
    }
    setErrorMessage(null);

    const newPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl(newPreviewUrl);
    onFileSelected(file);
  };

  return (
    <div className={styles.root}>
      <Avatar imageUrl={previewUrl ?? imageUrl} name={name} theme="dark" />
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
