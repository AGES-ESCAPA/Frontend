import { useEffect, useState, type FC } from 'react';
import styles from './TeaserPlayer.module.css';

export interface TeaserPlayerProps {
  src?: string;
  title: string;
}

export const TeaserPlayer: FC<TeaserPlayerProps> = ({ src, title }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <section className={styles.section} aria-labelledby="teaser-title">
      <h2 id="teaser-title">Conheça o curso</h2>
      <div className={styles.player}>
        {src && !hasError ? (
          <video
            controls
            preload="metadata"
            aria-label={`Teaser do curso ${title}`}
            onError={() => setHasError(true)}
          >
            <source src={src} type="video/mp4" />
            Seu navegador não suporta a reprodução de vídeo.
          </video>
        ) : (
          <p className={styles.unavailable} role="status">
            Vídeo não disponível para esse curso
          </p>
        )}
      </div>
    </section>
  );
};
