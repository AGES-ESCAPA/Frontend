import { Pause, Play } from 'lucide-react';
import type { ChangeEvent, CSSProperties, FC } from 'react';
import { formatTime } from '@utils/formatters';
import styles from './PlayerControls.module.css';

export interface PlayerControlsProps {
  isPlaying: boolean;
  /** Posição atual do vídeo, em segundos. */
  currentTime: number;
  /** Duração total do vídeo, em segundos. */
  duration: number;
  onTogglePlay: () => void;
  /** Disparado ao clicar ou arrastar a linha do tempo, com o novo tempo em segundos. */
  onSeek: (seconds: number) => void;
}

const toSafeDuration = (duration: number): number =>
  Number.isFinite(duration) && duration > 0 ? duration : 0;

/** Mantém o tempo entre 0 e a duração. Valores inválidos (NaN, Infinity) viram 0. */
const clampTime = (time: number, duration: number): number =>
  Number.isFinite(time) ? Math.min(Math.max(time, 0), duration) : 0;

const toProgressPercent = (time: number, duration: number): number =>
  duration > 0 ? Number(((time / duration) * 100).toFixed(2)) : 0;

/**
 * Barra de controles do player: botão de tocar/pausar, tempo decorrido e linha do tempo.
 * Não controla o vídeo — quem gerencia o estado é o `LessonVideoPlayer`.
 */
export const PlayerControls: FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
}) => {
  const safeDuration = toSafeDuration(duration);
  const safeCurrentTime = clampTime(currentTime, safeDuration);
  const percent = toProgressPercent(safeCurrentTime, safeDuration);
  const elapsed = formatTime(safeCurrentTime);
  const total = formatTime(safeDuration);
  const Icon = isPlaying ? Pause : Play;

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(event.target.value));
  };

  return (
    <div className={styles.controls}>
      <input
        type="range"
        className={styles.timeline}
        min={0}
        max={safeDuration}
        step={1}
        value={safeCurrentTime}
        style={{ '--progress': `${percent}%` } as CSSProperties}
        aria-label="Linha do tempo do vídeo"
        aria-valuetext={`${elapsed} de ${total}`}
        onChange={handleSeek}
      />
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.playButton}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          onClick={onTogglePlay}
        >
          <Icon className={styles.icon} fill="currentColor" aria-hidden="true" />
        </button>
        <span className={styles.time}>
          {elapsed} / {total}
        </span>
      </div>
    </div>
  );
};
