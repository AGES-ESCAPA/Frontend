import { Play } from 'lucide-react';
import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react';

import { toVimeoEmbedUrl } from '@utils/vimeo';
import { PlayerControls } from '../PlayerControls/PlayerControls';
import styles from './LessonVideoPlayer.module.css';

export interface LessonVideoPlayerProps {
  src: string;
  title: string;
  onEnded?: () => void;
}

interface VimeoMessage {
  event?: string;
  method?: string;
  value?: number;
  data?: {
    seconds?: number;
    duration?: number;
  };
}

export const LessonVideoPlayer: FC<LessonVideoPlayerProps> = ({ src, title, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const vimeoEmbedUrl = toVimeoEmbedUrl(src);
  const isVimeo = Boolean(vimeoEmbedUrl);

  const vimeoSrc = vimeoEmbedUrl ? `${vimeoEmbedUrl}&api=1` : null;

  const sendVimeoMessage = (method: string, value?: number) => {
    const iframe = iframeRef.current;

    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        method,
        ...(value !== undefined ? { value } : {}),
      },
      'https://player.vimeo.com',
    );
  };

  useEffect(() => {
    if (!isVimeo) return;

    const handleVimeoMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;

      let message: VimeoMessage;

      try {
        message =
          typeof event.data === 'string'
            ? (JSON.parse(event.data) as VimeoMessage)
            : (event.data as VimeoMessage);
      } catch {
        return;
      }

      if (message.event === 'ready') {
        setIsLoading(false);

        sendVimeoMessage('addEventListener', 'play' as unknown as number);
        sendVimeoMessage('addEventListener', 'pause' as unknown as number);
        sendVimeoMessage('addEventListener', 'timeupdate' as unknown as number);
        sendVimeoMessage('addEventListener', 'ended' as unknown as number);

        sendVimeoMessage('getDuration');

        return;
      }

      if (message.event === 'play') {
        setIsPlaying(true);
        return;
      }

      if (message.event === 'pause') {
        setIsPlaying(false);
        return;
      }

      if (message.event === 'timeupdate') {
        if (typeof message.data?.seconds === 'number') {
          setCurrentTime(message.data.seconds);
        }

        if (typeof message.data?.duration === 'number') {
          setDuration(message.data.duration);
        }

        return;
      }

      if (message.event === 'ended') {
        setIsPlaying(false);
        onEnded?.();
        return;
      }

      if (message.method === 'getDuration' && typeof message.value === 'number') {
        setDuration(message.value);
      }
    };

    window.addEventListener('message', handleVimeoMessage);

    return () => {
      window.removeEventListener('message', handleVimeoMessage);
    };
  }, [isVimeo, onEnded]);

  const handleTogglePlay = async () => {
    if (isVimeo) {
      sendVimeoMessage(isPlaying ? 'pause' : 'play');
      return;
    }

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
    if (isVimeo) {
      sendVimeoMessage('setCurrentTime', seconds);
      setCurrentTime(seconds);
      return;
    }

    const video = videoRef.current;

    if (!video) return;

    video.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code !== 'Space') return;

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
          {isVimeo && vimeoSrc ? (
            <iframe
              ref={iframeRef}
              className={styles.iframe}
              src={vimeoSrc}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              onError={handleError}
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
              <button
                type="button"
                className={styles.playButton}
                aria-label="Reproduzir vídeo"
                onClick={handleTogglePlay}
              >
                <Play className={styles.playIcon} fill="currentColor" aria-hidden="true" />
              </button>

              <p className={styles.title}>{title}</p>
            </div>
          )}

          {isLoading && (
            <p className={styles.loading} role="status">
              Carregando...
            </p>
          )}

          {!isLoading && (
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
