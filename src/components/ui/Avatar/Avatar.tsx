import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { useEffect, useState } from 'react';
import { useUserInitials } from '@hooks/useUserInitials';
import styles from './Avatar.module.css';

export type AvatarTheme = 'light' | 'dark';
/** `sm` (36px) para Navbar e Sidebar; `md` (56px) no cabeçalho do perfil; `lg` (80px) empilhado. */
export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  imageUrl?: string;
  name: string;
  theme?: AvatarTheme;
  size?: AvatarSize;
  className?: string;
}

export const Avatar = ({
  imageUrl,
  name,
  theme = 'light',
  size = 'sm',
  className = '',
}: AvatarProps) => {
  const initials = useUserInitials(name);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const shouldShowImage = Boolean(imageUrl?.trim()) && !hasImageError;

  const handleImageError = () => {
    setHasImageError(true);
  };

  return (
    <AvatarPrimitive.Root
      className={[
        styles.root,
        theme === 'dark' ? styles.dark : styles.light,
        size === 'md' && styles.medium,
        size === 'lg' && styles.large,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-size={size}
    >
      {shouldShowImage ? (
        <AvatarPrimitive.Image
          src={imageUrl}
          alt={name}
          className={styles.image}
          onError={handleImageError}
        />
      ) : null}

      <AvatarPrimitive.Fallback className={styles.fallback} delayMs={0}>
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
};
