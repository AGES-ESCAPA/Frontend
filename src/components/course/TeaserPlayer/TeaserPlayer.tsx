import { useEffect, useState, type FC } from 'react';
import styles from './TeaserPlayer.module.css';

export interface TeaserPlayerProps {
  src?: string;
  title: string;
}

const VIMEO_EMBED_QUERY =
  'badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0';

const toVimeoEmbedUrl = (src?: string): string | null => {
  if (!src) return null;
  const match = src.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? `https://player.vimeo.com/video/${match[1]}?${VIMEO_EMBED_QUERY}` : null;
};

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
