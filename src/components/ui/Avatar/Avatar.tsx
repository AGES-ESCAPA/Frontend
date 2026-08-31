import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { useEffect, useState } from 'react';
import { useUserInitials } from '@hooks/useUserInitials';
import styles from './Avatar.module.css';

export type AvatarTheme = 'light' | 'dark';

export interface AvatarProps {
  imageUrl?: string;
  name: string;
  theme?: AvatarTheme;
}

export const Avatar = ({ imageUrl, name, theme = 'light' }: AvatarProps) => {
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
      className={`${styles.root} ${theme === 'dark' ? styles.dark : styles.light}`}
    >
      {shouldShowImage ? (
        <AvatarPrimitive.Image
          src={imageUrl}
          alt={name}
          className={styles.image}
          onError={handleImageError}
        />
      ) : null}

      {!shouldShowImage ? (
        <AvatarPrimitive.Fallback className={styles.fallback} delayMs={0}>
          {initials}
        </AvatarPrimitive.Fallback>
      ) : null}
    </AvatarPrimitive.Root>
  );
};
