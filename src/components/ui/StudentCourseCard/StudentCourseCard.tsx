import { ArrowRight } from 'lucide-react';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { ProgressBar } from '@components/ui/ProgressBar';
import styles from './StudentCourseCard.module.css';

export type EnrollmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

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
  onAction?: (courseId: string, status: Exclude<EnrollmentStatus, 'PENDING'>) => void;
}

const statusDetails = {
  PENDING: { label: 'Pendente', variant: 'neutral' },
  IN_PROGRESS: { label: 'Em andamento', variant: 'info' },
  COMPLETED: { label: 'Concluído', variant: 'success' },
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
  onAction,
}: StudentCourseCardProps) => {
  const isPending = enrollmentStatus === 'PENDING';
  const isCompleted = enrollmentStatus === 'COMPLETED';
  const progress = Number.isFinite(progressPercentage)
    ? Math.min(100, Math.max(0, progressPercentage))
    : 0;
  const status = statusDetails[enrollmentStatus];

  const handleAction = () => {
    if (!isPending) onAction?.(courseId, enrollmentStatus);
  };

  return (
    <article className={`${styles.card} ${isPending ? styles.pending : ''}`}>
      <div className={styles.imageWrapper}>
        <img src={thumbnailUrl} alt={`Capa do curso ${title}`} className={styles.thumbnail} />
        <div className={styles.badges}>
          {category && <Badge category={category} />}
          <Badge label={status.label} variant={status.variant} />
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

        <footer className={styles.footer}>
          <span className={styles.metaInfo}>
            {durationTime}h · {lessonsCount} aulas
          </span>
          <Button
            type="button"
            label={
              isPending ? 'Aguardando' : isCompleted ? 'Visualizar Certificado' : 'Continuar Aula'
            }
            icon={!isPending && !isCompleted ? <ArrowRight aria-hidden="true" /> : undefined}
            variant={isPending || isCompleted ? 'outlined' : 'primary'}
            className={isCompleted ? styles.completedButton : styles.actionButton}
            disabled={isPending}
            onClick={handleAction}
          />
        </footer>
      </div>
    </article>
  );
};
