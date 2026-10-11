import { useEffect, useState, type FC } from 'react';
import { toVimeoEmbedUrl } from '@utils/vimeo';
import styles from './TeaserPlayer.module.css';

export interface TeaserPlayerProps {
  src?: string;
  title: string;
}

export const TeaserPlayer: FC<TeaserPlayerProps> = ({ src, title }) => {
  const [hasError, setHasError] = useState(false);
  const vimeoEmbedUrl = toVimeoEmbedUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const label = `Teaser do curso ${title}`;

  return (
    <section className={styles.section} aria-labelledby="teaser-title">
      <h2 id="teaser-title">Conheça o curso</h2>

      <div className={styles.player}>
        {vimeoEmbedUrl ? (
          <iframe
            src={vimeoEmbedUrl}
            title={label}
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : src && !hasError ? (
          <video controls preload="metadata" aria-label={label} onError={() => setHasError(true)}>
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
