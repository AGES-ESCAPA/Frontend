import VimeoPlayer from '@vimeo/player';
import { Check, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, type FC, type KeyboardEvent, type ReactNode } from 'react';

import { Button } from '@components/ui';
import { toVimeoEmbedUrl } from '@utils/vimeo';
import { resolveLessonPlaybackPosition, writeLessonPlayback } from '@utils/lessonPlayback';
import { CourseCompletionMessage } from '../CourseCompletionMessage/CourseCompletionMessage';
import { PlayerControls } from '../PlayerControls/PlayerControls';
import styles from './LessonVideoPlayer.module.css';

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const getFullscreenElement = (): Element | null =>
  document.fullscreenElement ?? (document as WebkitDocument).webkitFullscreenElement ?? null;

const requestPlayerFullscreen = (element: HTMLElement) => {
  if (element.requestFullscreen) return element.requestFullscreen();
  return (element as WebkitElement).webkitRequestFullscreen?.();
};

const exitPlayerFullscreen = () => {
  if (document.exitFullscreen) return document.exitFullscreen();
  return (document as WebkitDocument).webkitExitFullscreen?.();
};

export interface LessonVideoPlayerProps {
  /** URL do vídeo (MP4 ou Vimeo). Vazia, exibe "Vídeo indisponível". */
  src: string;
  title: string;
  /** Identificador da aula: grava e restaura o ponto assistido ao sair e voltar. */
  lessonId?: string;
  /** Aula já marcada como concluída: overlay "Aula concluída" e assistir novamente. */
  isCompleted?: boolean;
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
  lessonId,
  isCompleted = false,
  courseTitle = '',
  isLastLesson = false,
  onEnded,
  onViewOtherCourses,
  onViewCertificate,
  previousAction,
  nextAction,
  controlsAction,
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);
  const lessonIdRef = useRef(lessonId);
  const latestPlaybackRef = useRef({ position: 0, duration: 0 });
  const persistTimeoutRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasCompletedCourse, setHasCompletedCourse] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // A aula concluída fica no recado até o aluno escolher rever. Um play do
  // próprio player (retomada da posição salva) não pode dispensar esse recado.
  const [isRewatching, setIsRewatching] = useState(false);
  const isRewatchingRef = useRef(false);
  const isCompletedRef = useRef(isCompleted);

  lessonIdRef.current = lessonId;
  isCompletedRef.current = isCompleted;
  isRewatchingRef.current = isRewatching;

  const vimeoEmbedUrl = toVimeoEmbedUrl(src);
  const isVimeo = Boolean(vimeoEmbedUrl);
  // `controls=0` esconde a interface do Vimeo (contas Plus ou superiores) para usar a
  // barra do PlayerControls; nas demais contas o Vimeo ignora o parâmetro.
  const vimeoPlayerUrl = vimeoEmbedUrl ? `${vimeoEmbedUrl}&controls=0` : null;

  const flushPlayback = () => {
    if (persistTimeoutRef.current != null) {
      window.clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = null;
    }

    const currentLessonId = lessonIdRef.current;
    const latest = latestPlaybackRef.current;

    if (!currentLessonId || latest.duration <= 0) return;

    writeLessonPlayback(currentLessonId, latest);
  };

  const queuePlayback = (position: number, videoDuration: number) => {
    latestPlaybackRef.current = { position, duration: videoDuration };

    if (!lessonIdRef.current || videoDuration <= 0 || persistTimeoutRef.current != null) return;

    persistTimeoutRef.current = window.setTimeout(() => {
      persistTimeoutRef.current = null;
      flushPlayback();
    }, 1000);
  };

  const rememberPlayback = (position: number, videoDuration: number) => {
    setCurrentTime(position);
    latestPlaybackRef.current = { position, duration: videoDuration };
  };

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(getFullscreenElement() === playerRef.current);
    };

    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (getFullscreenElement() === playerRef.current) {
        await exitPlayerFullscreen();
      } else if (playerRef.current) {
        await requestPlayerFullscreen(playerRef.current);
      }
    } catch {
      // O navegador pode recusar fora de um gesto do usuário.
    }
  };

  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    latestPlaybackRef.current = { position: 0, duration: 0 };
    // Trocar de aula (voltar ou avançar) descarta a mensagem de parabenização
    // de uma conclusão anterior; ela só volta se essa nova aula também terminar.
    setHasCompletedCourse(false);
    isRewatchingRef.current = false;
    setIsRewatching(false);
  }, [src, lessonId]);

  // Se a grade só confirma a conclusão depois do vídeo já ter começado, pausa
  // e mantém o recado até o aluno escolher rever.
  useEffect(() => {
    if (!isCompleted || isRewatching) return;

    const video = videoRef.current;

    if (video && !video.paused) {
      video.pause();
    }

    void vimeoPlayerRef.current?.pause().catch(() => {});
  }, [isCompleted, isRewatching]);

  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current != null) {
        window.clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }

      const latest = latestPlaybackRef.current;

      // `lessonId` vem do fechamento deste efeito: na troca de aula ainda é o id anterior.
      if (!lessonId || latest.duration <= 0) return;

      writeLessonPlayback(lessonId, latest);
    };
  }, [lessonId, src]);

  const beginRewatch = () => {
    isRewatchingRef.current = true;
    setIsRewatching(true);
  };

  const holdCompletedLesson = () => isCompletedRef.current && !isRewatchingRef.current;

  const handleTogglePlay = async () => {
    // Com o recado de aula concluída na frente, só "Assistir novamente" inicia o vídeo.
    // Play/seek da barra (e o restore da posição) não podem dispensar o overlay.
    if (holdCompletedLesson()) return;

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
    if (holdCompletedLesson()) {
      videoRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    // Rever a aula depois de concluída não deve manter a mensagem de
    // parabenização: ela só volta se o vídeo terminar de novo.
    setHasCompletedCourse(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
    flushPlayback();
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    const videoDuration = video.duration;
    const position = resolveLessonPlaybackPosition(lessonId ?? '', videoDuration);

    setDuration(videoDuration);
    rememberPlayback(position, videoDuration);

    // Ir exatamente até o fim dispara `ended`/`play` e esconde o recado de
    // aula concluída. Um passo antes basta para retomar de onde parou.
    if (position > 0 && position < videoDuration) {
      video.currentTime = position;
    }

    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    rememberPlayback(video.currentTime, video.duration || duration);
    queuePlayback(video.currentTime, video.duration || duration);
  };

  const handleSeek = (seconds: number) => {
    if (holdCompletedLesson()) return;

    if (isVimeo) {
      vimeoPlayerRef.current?.setCurrentTime(seconds).catch(() => {});
      rememberPlayback(seconds, duration);
      queuePlayback(seconds, duration);
      return;
    }

    const video = videoRef.current;

    if (!video) return;

    video.currentTime = seconds;
    rememberPlayback(seconds, duration);
    queuePlayback(seconds, duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    isRewatchingRef.current = false;
    setIsRewatching(false);
    const endedAt = duration > 0 ? duration : latestPlaybackRef.current.duration;
    rememberPlayback(endedAt, endedAt);
    flushPlayback();
    if (isLastLesson) {
      setHasCompletedCourse(true);
    }
    onEnded?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleWatchAgain = async () => {
    beginRewatch();
    setHasCompletedCourse(false);
    rememberPlayback(0, duration);
    flushPlayback();

    if (isVimeo) {
      const vimeoPlayer = vimeoPlayerRef.current;

      if (!vimeoPlayer) {
        isRewatchingRef.current = false;
        setIsRewatching(false);
        return;
      }

      try {
        await vimeoPlayer.setCurrentTime(0);
        await vimeoPlayer.play();
      } catch {
        // O aluno ainda pode usar os controles do player.
      }
      return;
    }

    const video = videoRef.current;

    if (!video) return;

    video.currentTime = 0;

    try {
      await video.play();
    } catch {
      setHasError(true);
    }
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
      if (isCompletedRef.current && !isRewatchingRef.current) {
        void vimeoPlayer.pause().catch(() => {});
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);
      setHasCompletedCourse(false);
    };
    const onPause = () => {
      setIsPlaying(false);
      flushPlayback();
    };
    const onTimeUpdate = ({
      seconds,
      duration: eventDuration,
    }: {
      seconds: number;
      duration?: number;
    }) => {
      const videoDuration = eventDuration || latestPlaybackRef.current.duration;
      rememberPlayback(seconds, videoDuration);
      queuePlayback(seconds, videoDuration);
    };
    const onVimeoEnded = () => handleEndedRef.current();

    vimeoPlayer.on('play', onPlay);
    vimeoPlayer.on('pause', onPause);
    vimeoPlayer.on('timeupdate', onTimeUpdate);
    vimeoPlayer.on('ended', onVimeoEnded);

    vimeoPlayer
      .ready()
      .then(() => vimeoPlayer.getDuration())
      .then((videoDuration) => {
        if (!isActive) return undefined;

        const position = resolveLessonPlaybackPosition(lessonId ?? '', videoDuration);
        // O fim exato do vídeo rejeita ou trava o seek do Vimeo e o player
        // nunca sai do carregamento — a aula concluída ficaria sem o recado.
        const seekTo = position >= videoDuration ? Math.max(0, videoDuration - 0.25) : position;

        setDuration(videoDuration);
        rememberPlayback(position, videoDuration);

        if (seekTo > 0) {
          return vimeoPlayer
            .setCurrentTime(seekTo)
            .catch(() => undefined)
            .then(() => {
              if (isActive) setIsLoading(false);
            });
        }

        setIsLoading(false);
        return undefined;
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
    // lessonId entra para restaurar o ponto certo deste vídeo; o iframe já é recriado por URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vimeoPlayerUrl, lessonId]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Só quando o foco está no próprio player, não em um botão lá dentro.
    if (event.target !== event.currentTarget) return;

    if (event.code === 'Space') {
      event.preventDefault();
      void handleTogglePlay();
      return;
    }

    if (event.code === 'KeyF') {
      event.preventDefault();
      void handleToggleFullscreen();
    }
  };

  // Sem `src` (aula de vídeo sem link cadastrado), o player aparece como indisponível
  // mas continua exibindo as ações da aula.
  const isUnavailable = hasError || !src;
  const showControls = !isUnavailable && !isLoading;
  // Enquanto o aluno não escolher rever, a aula concluída cobre o vídeo mesmo
  // durante o carregamento ou se o player disparar play ao restaurar a posição.
  const showLessonCompleted = isCompleted && !isRewatching && !hasCompletedCourse;
  const showOverlay = showLessonCompleted || hasCompletedCourse || (!isPlaying && !isLoading);
  // Vídeo/iframe em camada de hardware cobre o HTML; com o recado na frente a mídia fica oculta.
  const coverMedia = showOverlay;

  return (
    <div
      ref={playerRef}
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
              className={`${styles.iframe} ${coverMedia ? styles.mediaCovered : ''}`}
              src={vimeoPlayerUrl}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              className={`${styles.video} ${coverMedia ? styles.mediaCovered : ''}`}
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

          {showOverlay && (
            <div
              className={`${styles.overlay} ${
                hasCompletedCourse || showLessonCompleted ? styles.overlayDisabled : ''
              }`}
            >
              {hasCompletedCourse ? (
                <CourseCompletionMessage
                  courseTitle={courseTitle}
                  onViewOtherCourses={onViewOtherCourses ?? (() => {})}
                  onViewCertificate={onViewCertificate ?? (() => {})}
                />
              ) : showLessonCompleted ? (
                <div className={styles.completedMessage} role="status">
                  <p className={styles.completedLabel}>
                    <span className={styles.completedCheck} aria-hidden="true">
                      <Check size={12} />
                    </span>
                    Aula concluída
                  </p>
                  <Button
                    label="Assistir novamente"
                    variant="secondary"
                    className={styles.watchAgainButton}
                    icon={<RotateCcw size={16} aria-hidden="true" />}
                    onClick={() => void handleWatchAgain()}
                  />
                </div>
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

          {isLoading && !isVimeo && !showLessonCompleted && (
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
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
