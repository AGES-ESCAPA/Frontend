import type { ReactNode } from 'react';
import type { AvatarSize } from '../Avatar/Avatar';

/** Pedaços do upload para o chamador posicionar avatar e botão, como no perfil. */
export interface AvatarUploadParts {
  avatar: ReactNode;
  changePhotoButton: ReactNode;
  error: ReactNode | null;
}

/** Propriedades necessárias para selecionar e validar uma nova foto de perfil. */
export interface AvatarUploadProps {
  imageUrl?: string | null;
  name: string;
  onFileSelected: (file: File) => void;
  maxSizeBytes?: number;
  size?: AvatarSize;
  avatarClassName?: string;
  /** Botão só com ícone e texto, sem fundo preenchido. */
  compact?: boolean;
  /** Quando informado, avatar e botão saem do empilhamento padrão. */
  children?: (parts: AvatarUploadParts) => ReactNode;
}
