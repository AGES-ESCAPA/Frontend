import styles from './MyCourseCard.module.css';
import type { Course } from '../../../pages/MyCourses/mockCourses';

interface MyCourseCardProps {
  course: Course;
}

export const MyCourseCard = ({ course }: MyCourseCardProps) => {
  const isCompleted = course.status === 'COMPLETED';
  const isPending = course.status === 'PENDING';

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={course.thumbnailUrl} alt={course.title} className={styles.thumbnail} />

        <span className={styles.categoryBadge}>{course.category}</span>
        {isPending && <span className={styles.pendingBadge}>PENDENTE</span>}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.description}>{course.description}</p>

        <p className={styles.instructor}>
          Instrutor: <strong>{course.instructor}</strong>
        </p>
        {!isPending && (
          <div className={styles.progressSection}>
            <div className={styles.progressBarBg}>
              <div
                className={`${styles.progressBarFill} ${isCompleted ? styles.completedFill : ''}`}
                style={{ width: `${course.progressPercentage}%` }}
              />
            </div>
            <span className={styles.progressText}>{course.progressPercentage}%</span>
          </div>
        )}
        <footer className={styles.footer}>
          <span className={styles.metaInfo}>
            {course.durationHours}h • {course.lessonsCount} aulas
          </span>
          <button
            className={`
              ${styles.actionButton} 
              ${isCompleted ? styles.btnCompleted : ''} 
              ${isPending ? styles.btnPending : ''}
            `}
          >
            {isCompleted ? 'Visualizar Certificado' : isPending ? 'Aguardando' : 'Continuar Aula ➔'}
          </button>
        </footer>
      </div>
    </article>
  );
};
