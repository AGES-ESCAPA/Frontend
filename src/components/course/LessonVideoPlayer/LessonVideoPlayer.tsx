import { Play } from 'lucide-react';
import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react';

import { toVimeoEmbedUrl } from '@utils/vimeo';
import { CourseCompletionMessage } from '../CourseCompletionMessage/CourseCompletionMessage';
import { PlayerControls } from '../PlayerControls/PlayerControls';
import styles from './LessonVideoPlayer.module.css';

export interface LessonVideoPlayerProps {
  src: string;
  title: string;
  /** Nome do curso, exibido na mensagem de parabenização (US-17). */
  courseTitle?: string;
  /** Se a aula atual é a última do curso: controla se o término do vídeo mostra a mensagem de parabenização. */
  isLastLesson?: boolean;
  onEnded?: () => void;
  onViewOtherCourses?: () => void;
  onViewCertificate?: () => void;
}

export const LessonVideoPlayer: FC<LessonVideoPlayerProps> = ({
  src,
  title,
  courseTitle = '',
  isLastLesson = false,
  onEnded,
  onViewOtherCourses,
  onViewCertificate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasCompletedCourse, setHasCompletedCourse] = useState(false);

  const vimeoEmbedUrl = toVimeoEmbedUrl(src);
  const isVimeo = Boolean(vimeoEmbedUrl);

  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    // Trocar de aula (voltar ou avançar) descarta a mensagem de parabenização
    // de uma conclusão anterior; ela só volta se essa nova aula também terminar.
    setHasCompletedCourse(false);
  }, [src]);

  const handleTogglePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setHasError(true);
      }
    } else {
      video.pause();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    setDuration(video.duration);
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(video.currentTime);
  };

  const handleSeek = (seconds: number) => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (isLastLesson) {
      setHasCompletedCourse(true);
    }
    onEnded?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code !== 'Space' || isVimeo) return;

    event.preventDefault();
    void handleTogglePlay();
  };

  return (
    <div
      className={styles.player}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Player da aula ${title}`}
    >
      {hasError ? (
        <p className={styles.unavailable} role="status">
          Vídeo indisponível
        </p>
      ) : (
        <>
          {isVimeo && vimeoEmbedUrl ? (
            <iframe
              className={styles.iframe}
              src={vimeoEmbedUrl}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              className={styles.video}
              src={src}
              preload="metadata"
              aria-label={title}
              onClick={handleTogglePlay}
              onPlay={handlePlay}
              onPause={handlePause}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={handleError}
            />
          )}

          {!isPlaying && !isLoading && !isVimeo && (
            <div className={styles.overlay}>
              {hasCompletedCourse ? (
                <CourseCompletionMessage
                  courseTitle={courseTitle}
                  onViewOtherCourses={onViewOtherCourses ?? (() => {})}
                  onViewCertificate={onViewCertificate ?? (() => {})}
                />
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.playButton}
                    aria-label="Reproduzir vídeo"
                    onClick={handleTogglePlay}
                  >
                    <Play className={styles.playIcon} fill="currentColor" aria-hidden="true" />
                  </button>

                  <p className={styles.title}>{title}</p>
                </>
              )}
            </div>
          )}

          {isLoading && !isVimeo && (
            <p className={styles.loading} role="status">
              Carregando...
            </p>
          )}

          {!isLoading && !isVimeo && (
            <div className={styles.controls}>
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
