import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import styles from './OrderSummary.module.css';

interface CourseCoverProps {
  imageUrl?: string | null;
  title: string;
}

export const CourseCover = ({ imageUrl, title }: CourseCoverProps) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const validUrl = imageUrl?.trim();
  const showFallback = !validUrl || failedUrl === validUrl;

  if (showFallback) {
    return (
      <div
        className={`${styles.cover} ${styles.coverFallback}`}
        role="img"
        aria-label={`Capa indisponível para o curso ${title}`}
      >
        <GraduationCap size={40} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      className={styles.cover}
      src={validUrl}
      alt={`Capa do curso ${title}`}
      onError={() => setFailedUrl(validUrl)}
    />
  );
};
