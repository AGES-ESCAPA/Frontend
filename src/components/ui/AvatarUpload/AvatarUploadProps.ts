/** Propriedades necessárias para selecionar e validar uma nova foto de perfil. */
export interface AvatarUploadProps {
  imageUrl: string;
  name: string;
  onFileSelected: (file: File) => void;
  maxSizeBytes?: number;
}
