import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Badge } from '../Badge/Badge';
import type { BadgeCategory } from '../Badge/Badge';
import { Button } from '../Button/Button';
import styles from './CourseCard.module.css';

export type CourseLevel = 'basic' | 'intermediate' | 'advanced';

export interface CourseCardProps {
  id: string;
  imageUrl: string;
  category: BadgeCategory;
  level: CourseLevel;
  title: string;
  description: string;
  rating?: number;
  reviewsCount?: number;
  duration: string;
  lessonsCount: number;
  instructor: string;
  price: string;
  /** Curso já comprado pelo aluno: capa em preto e branco, tag e acesso. */
  acquired?: boolean;
  onClick: (id: string) => void;
  /** Abre o curso adquirido. Se omitido, o botão Acessar reutiliza `onClick`. */
  onAccess?: (id: string) => void;
}

export const CourseCard = ({
  id,
  imageUrl,
  category,
  level,
  title,
  description,
  rating,
  reviewsCount,
  duration,
  lessonsCount,
  instructor,
  price,
  acquired = false,
  onClick,
  onAccess,
}: CourseCardProps) => {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = imageError || !imageUrl;

  const handleClick = () => onClick(id);

  const handleAccessClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onAccess) {
      onAccess(id);
      return;
    }
    onClick(id);
  };

  const handleAccessKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(id);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes do curso ${title}`}
    >
      <div className={styles.imageWrapper}>
        {showPlaceholder ? (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        ) : (
          <img
            src={imageUrl}
            alt={`Capa do curso ${title}`}
            className={acquired ? `${styles.image} ${styles.imageAcquired}` : styles.image}
            onError={() => setImageError(true)}
          />
        )}

        <div className={styles.badgeLeft}>
          <Badge category={category} />
        </div>
        <div className={styles.badgeRight}>
          <Badge category={level} variant="neutral" />
        </div>
        {acquired ? <span className={styles.acquiredTag}>Adquirido</span> : null}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        <div className={styles.meta}>
          {rating !== undefined && (
            <>
              <span className={styles.ratingGroup}>
                <svg
                  className={styles.star}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.9l-5.2 2.73.99-5.8-4.21-4.1 5.82-.85L10 1.5z" />
                </svg>
                <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
                {reviewsCount !== undefined && (
                  <span className={styles.reviewsCount}>({reviewsCount})</span>
                )}
              </span>
              <span className={styles.metaDot}>•</span>
            </>
          )}
          <span className={styles.metaItem}>{duration}</span>
          <span className={styles.metaDot}>•</span>
          <span className={styles.metaItem}>{lessonsCount} aulas</span>
        </div>

        <div className={styles.footer}>
          <span className={styles.instructor}>{instructor}</span>
          {acquired ? (
            <Button
              type="button"
              label="Acessar"
              variant="ghost-dark"
              className={styles.accessButton}
              aria-label={`Acessar o curso ${title}`}
              onClick={handleAccessClick}
              onKeyDown={handleAccessKeyDown}
            />
          ) : (
            <span className={styles.price}>{price}</span>
          )}
        </div>
      </div>
    </div>
  );
};
