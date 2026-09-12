import type { FC } from 'react';
import styles from './TeaserPlayer.module.css';

export interface TeaserPlayerProps {
  src: string;
  title: string;
}

export const TeaserPlayer: FC<TeaserPlayerProps> = ({ src, title }) => (
  <section className={styles.section} aria-labelledby="teaser-title">
    <h2 id="teaser-title">Conheça o curso</h2>
    <div className={styles.player}>
      <video controls preload="metadata" aria-label={`Teaser do curso ${title}`}>
        <source src={src} type="video/mp4" />
        Seu navegador não suporta a reprodução de vídeo.
      </video>
    </div>
  </section>
);
