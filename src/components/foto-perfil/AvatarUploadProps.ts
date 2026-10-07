import * as React from 'react';

/** Propriedades necessárias para selecionar e validar uma nova foto de perfil. */
export interface AvatarUploadProps {
  imageUrl: string;
  name: string;
  onFileSelected: (file: File) => void;
  maxSizeBytes: number;
}

// Tipos aceitos pelo campo de seleção de imagem.
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Permite selecionar uma foto de perfil, exibir sua pré-visualização
 * e informar ao componente pai quando o arquivo for válido.
 */
export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  imageUrl,
  name,
  onFileSelected,
  maxSizeBytes = MAX_FILE_SIZE_BYTES,
}) => {
  const [previewUrl, setPreviewUrl] = React.useState<string>(imageUrl);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Libera a URL temporária para evitar acúmulo de objetos no navegador.
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Aciona o input nativo por meio do botão visível para o usuário.
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Valida o arquivo, atualiza a pré-visualização e notifica o componente pai.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    onFileSelected(file);
  };

  return React.createElement(
    'div',
    { className: 'flex flex-col items-center gap-3' },
    React.createElement('img', {
      src: previewUrl || imageUrl || undefined,
      alt: name,
    }),
    React.createElement('input', {
      type: 'file',
      ref: fileInputRef,
      onChange: handleFileChange,
      accept: 'image/jpeg,image/png,image/webp',
      className: 'hidden',
      'data-testid': 'avatar-file-input',
    }),
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: handleButtonClick,
        className: 'btn-secondary text-sm font-medium',
      },
      'Alterar foto',
    ),
    errorMessage &&
      React.createElement(
        'span',
        { role: 'alert', className: 'text-xs text-red-500 mt-1' },
        errorMessage,
      ),
  );
};
