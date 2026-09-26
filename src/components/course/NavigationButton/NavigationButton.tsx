import { SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useState, type FC } from 'react';
import type { LessonRef } from '@/types/course';
import styles from './NavigationButton.module.css';

export interface NavigationButtonProps {
  /** Aula sendo exibida no momento. */
  actualLesson: LessonRef;
  /**
   * Aula para onde o botão leva, ou `null` quando não há aula nessa direção
   * (ex.: `actualLesson` é a primeira/última do curso). Com `null`, o
   * componente não renderiza nada.
   */
  targetLesson: LessonRef | null;
  /** Lado do botão e sentido da navegação. */
  direction: 'previous' | 'next';
  /** Disparado ao clicar, com a aula de destino. A troca de rota/estado fica por conta de quem usa o componente. */
  onNavigate: (lesson: LessonRef) => void;
  /** Vídeo da aula de destino, usado só para detectar falha de carregamento. */
  previewVideoUrl?: string;
}

const LABELS = {
  previous: 'Aula anterior',
  next: 'Próxima aula',
} as const;

/**
 * Botão que leva à aula anterior ou seguinte do curso (US-14). Não decide
 * sozinho se há uma aula anterior/seguinte: isso é responsabilidade de quem
 * monta `targetLesson` (`null` quando não há aula nessa direção).
 */
export const NavigationButton: FC<NavigationButtonProps> = ({
  actualLesson,
  targetLesson,
  direction,
  onNavigate,
  previewVideoUrl,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [previewVideoUrl]);

  if (!targetLesson) {
    return null;
  }

  const isPrevious = direction === 'previous';
  const Icon = isPrevious ? SkipBack : SkipForward;
  const label = LABELS[direction];

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        aria-label={`${label}: ${targetLesson.title}`}
        title={`De "${actualLesson.title}" para "${targetLesson.title}"`}
        onClick={() => onNavigate(targetLesson)}
      >
        <Icon className={styles.icon} aria-hidden="true" />
      </button>

      {previewVideoUrl && (
        <video
          className={styles.previewProbe}
          src={previewVideoUrl}
          preload="metadata"
          muted
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setHasError(true)}
        />
      )}

      {hasError && (
        <span className={styles.srOnly} role="status">
          Vídeo indisponível
        </span>
      )}
    </div>
  );
};
