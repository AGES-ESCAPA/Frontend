import VimeoPlayer from '@vimeo/player';
import { Play } from 'lucide-react';
import { useEffect, useRef, useState, type FC, type KeyboardEvent, type ReactNode } from 'react';

import { toVimeoEmbedUrl } from '@utils/vimeo';
import { CourseCompletionMessage } from '../CourseCompletionMessage/CourseCompletionMessage';
import { PlayerControls } from '../PlayerControls/PlayerControls';
import styles from './LessonVideoPlayer.module.css';

export interface LessonVideoPlayerProps {
  /** URL do vídeo (MP4 ou Vimeo). Vazia, exibe "Vídeo indisponível". */
  src: string;
  title: string;
  /** Nome do curso, exibido na mensagem de parabenização (US-17). */
  courseTitle?: string;
  /** Se a aula atual é a última do curso: controla se o término do vídeo mostra a mensagem de parabenização. */
  isLastLesson?: boolean;
  onEnded?: () => void;
  onViewOtherCourses?: () => void;
  onViewCertificate?: () => void;
  /** Exibido sobre o vídeo, centralizado na borda esquerda (ex.: aula anterior). */
  previousAction?: ReactNode;
  /** Exibido sobre o vídeo, centralizado na borda direita (ex.: próxima aula). */
  nextAction?: ReactNode;
  /**
   * Exibido à direita da barra de controles (ex.: concluir a aula). Enquanto a
   * barra não aparece (carregando ou vídeo indisponível), fica no canto inferior direito.
   */
  controlsAction?: ReactNode;
}

export const LessonVideoPlayer: FC<LessonVideoPlayerProps> = ({
  src,
  title,
  courseTitle = '',
  isLastLesson = false,
  onEnded,
  onViewOtherCourses,
  onViewCertificate,
  previousAction,
  nextAction,
  controlsAction,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasCompletedCourse, setHasCompletedCourse] = useState(false);

  const vimeoEmbedUrl = toVimeoEmbedUrl(src);
  const isVimeo = Boolean(vimeoEmbedUrl);
  // `controls=0` esconde a interface do Vimeo (contas Plus ou superiores) para usar a
  // barra do PlayerControls; nas demais contas o Vimeo ignora o parâmetro.
  const vimeoPlayerUrl = vimeoEmbedUrl ? `${vimeoEmbedUrl}&controls=0` : null;

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
    if (isVimeo) {
      const vimeoPlayer = vimeoPlayerRef.current;

      if (!vimeoPlayer) return;

      try {
        if (await vimeoPlayer.getPaused()) {
          await vimeoPlayer.play();
        } else {
          await vimeoPlayer.pause();
        }
      } catch {
        // O navegador pode recusar o play (ex.: autoplay bloqueado); o aluno usa o Vimeo.
      }
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
    // Rever a aula depois de concluída não deve manter a mensagem de
    // parabenização: ela só volta se o vídeo terminar de novo.
    setHasCompletedCourse(false);
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
      vimeoPlayerRef.current?.setCurrentTime(seconds).catch(() => {});
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
    if (isLastLesson) {
      setHasCompletedCourse(true);
    }
    onEnded?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Os eventos do Vimeo são registrados uma vez por vídeo; o ref mantém o
  // handleEnded atual (isLastLesson/onEnded) sem recriar o player.
  const handleEndedRef = useRef(handleEnded);

  useEffect(() => {
    handleEndedRef.current = handleEnded;
  });

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!vimeoPlayerUrl || !iframe) return undefined;

    let isActive = true;
    const vimeoPlayer = new VimeoPlayer(iframe);
    vimeoPlayerRef.current = vimeoPlayer;

    const onPlay = () => {
      setIsPlaying(true);
      setHasCompletedCourse(false);
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = ({ seconds }: { seconds: number }) => setCurrentTime(seconds);
    const onVimeoEnded = () => handleEndedRef.current();

    vimeoPlayer.on('play', onPlay);
    vimeoPlayer.on('pause', onPause);
    vimeoPlayer.on('timeupdate', onTimeUpdate);
    vimeoPlayer.on('ended', onVimeoEnded);

    vimeoPlayer
      .ready()
      .then(() => vimeoPlayer.getDuration())
      .then((videoDuration) => {
        if (!isActive) return;
        setDuration(videoDuration);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
      vimeoPlayer.off('play', onPlay);
      vimeoPlayer.off('pause', onPause);
      vimeoPlayer.off('timeupdate', onTimeUpdate);
      vimeoPlayer.off('ended', onVimeoEnded);
      vimeoPlayerRef.current = null;
    };
  }, [vimeoPlayerUrl]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // event.target !== event.currentTarget: o Espaço só reproduz/pausa quando
    // o foco está no próprio player, não quando vem de um elemento focável lá
    // dentro (ex.: os botões da mensagem de parabenização).
    if (event.code !== 'Space' || event.target !== event.currentTarget) return;

    event.preventDefault();
    void handleTogglePlay();
  };

  // Sem `src` (aula de vídeo sem link cadastrado), o player aparece como indisponível
  // mas continua exibindo as ações da aula.
  const isUnavailable = hasError || !src;
  const showControls = !isUnavailable && !isLoading;

  return (
    <div
      className={styles.player}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Player da aula ${title}`}
    >
      {previousAction && (
        <div className={`${styles.sideAction} ${styles.sideActionStart}`}>{previousAction}</div>
      )}

      {nextAction && (
        <div className={`${styles.sideAction} ${styles.sideActionEnd}`}>{nextAction}</div>
      )}

      {controlsAction && !showControls && (
        <div className={styles.floatingAction}>{controlsAction}</div>
      )}

      {isUnavailable ? (
        <p className={styles.unavailable} role="status">
          Vídeo indisponível
        </p>
      ) : (
        <>
          {vimeoPlayerUrl ? (
            <iframe
              // Um iframe novo por vídeo: o SDK do Vimeo guarda um player por elemento.
              key={vimeoPlayerUrl}
              ref={iframeRef}
              className={styles.iframe}
              src={vimeoPlayerUrl}
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

          {!isPlaying && !isLoading && (
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

          {showControls && (
            <div className={styles.controls}>
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                actions={controlsAction}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
