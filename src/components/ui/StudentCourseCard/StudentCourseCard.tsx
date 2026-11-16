import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { ProgressBar } from '@components/ui/ProgressBar';
import { CourseRatingModal } from '@components/ui/CourseRatingModal';
import { StarRating } from '@components/ui/StarRating';
import styles from './StudentCourseCard.module.css';

export type EnrollmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface StudentCourseCardProps {
  courseId: string;
  title: string;
  thumbnailUrl: string;
  instructor: string;
  durationTime: number;
  lessonsCount: number;
  progressPercentage: number;
  enrollmentStatus: EnrollmentStatus;
  category?: string;
  description?: string;
  /** Nota (1 a 5) do aluno; só relevante em cursos concluídos. */
  myRating?: number | null;
  onAction?: (courseId: string, status: Exclude<EnrollmentStatus, 'PENDING' | 'EXPIRED'>) => void;
  /** Chamado quando o aluno salva uma avaliação neste card. */
  onRated?: (courseId: string, rating: number) => void;
}

const statusDetails = {
  PENDING: { label: 'Pendente', variant: 'neutral' },
  IN_PROGRESS: { label: 'Em andamento', variant: 'info' },
  COMPLETED: { label: 'Concluído', variant: 'success' },
  EXPIRED: { label: 'Expirado', variant: 'error' },
} as const;

export const StudentCourseCard = ({
  courseId,
  title,
  thumbnailUrl,
  instructor,
  durationTime,
  lessonsCount,
  progressPercentage,
  enrollmentStatus,
  category,
  description,
  myRating = null,
  onAction,
  onRated,
}: StudentCourseCardProps) => {
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [localRating, setLocalRating] = useState<number | null>(myRating ?? null);

  useEffect(() => {
    setLocalRating(myRating ?? null);
  }, [myRating]);

  const isPending = enrollmentStatus === 'PENDING';
  const isCompleted = enrollmentStatus === 'COMPLETED';
  const isExpired = enrollmentStatus === 'EXPIRED';
  const progress = Number.isFinite(progressPercentage)
    ? Math.min(100, Math.max(0, progressPercentage))
    : 0;
  const status = statusDetails[enrollmentStatus];
  const displayedRating = localRating ?? myRating ?? null;
  const needsRating = isCompleted && displayedRating == null;

  const handleAction = () => {
    if (!isPending && !isExpired)
      onAction?.(courseId, enrollmentStatus as Exclude<EnrollmentStatus, 'PENDING' | 'EXPIRED'>);
  };

  const handleRated = (rating: number) => {
    setLocalRating(rating);
    onRated?.(courseId, rating);
  };

  return (
    <article className={`${styles.card} ${isPending || isExpired ? styles.pending : ''}`}>
      <div className={styles.imageWrapper}>
        <img src={thumbnailUrl} alt={`Capa do curso ${title}`} className={styles.thumbnail} />
        <div className={styles.badges}>
          {category && <Badge category={category} />}
          {enrollmentStatus !== 'IN_PROGRESS' && (
            <Badge label={status.label} variant={status.variant} />
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        <p className={styles.instructor}>
          Instrutor: <strong>{instructor}</strong>
        </p>

        {!isPending && (
          <div className={styles.progressSection}>
            <ProgressBar
              value={progress}
              variant={isCompleted ? 'success' : 'default'}
              className={styles.progressBar}
              aria-label={`Progresso do curso ${title}`}
            />
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}

        {isCompleted && (
          <div className={styles.ratingSection}>
            {needsRating ? (
              <button
                type="button"
                className={styles.ratePrompt}
                onClick={() => setIsRatingOpen(true)}
              >
                <span className={styles.ratePromptLabel}>Avaliar curso</span>
                <StarRating value={null} size="sm" label="Avaliar curso" />
              </button>
            ) : (
              <StarRating value={displayedRating} size="sm" label="Sua avaliação" />
            )}
          </div>
        )}

        <footer className={styles.footer}>
          <span className={styles.metaInfo}>
            {durationTime}h · {lessonsCount} aulas
          </span>
          <Button
            type="button"
            label={
              isExpired
                ? 'Expirado'
                : isPending
                  ? 'Aguardando'
                  : isCompleted
                    ? 'Visualizar Certificado'
                    : 'Continuar Aula'
            }
            icon={
              !isPending && !isCompleted && !isExpired ? (
                <ArrowRight aria-hidden="true" />
              ) : undefined
            }
            variant={isPending || isCompleted || isExpired ? 'outlined' : 'primary'}
            className={isCompleted ? styles.completedButton : styles.actionButton}
            disabled={isPending || isExpired}
            onClick={handleAction}
          />
        </footer>
      </div>

      {needsRating || isRatingOpen ? (
        <CourseRatingModal
          open={isRatingOpen}
          onOpenChange={setIsRatingOpen}
          courseId={courseId}
          courseTitle={title}
          onRated={handleRated}
        />
      ) : null}
    </article>
  );
};
