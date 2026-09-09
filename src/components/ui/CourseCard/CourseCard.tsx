import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge } from '../Badge/Badge';
import type { BadgeCategory } from '../Badge/Badge';
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
  onClick: (id: string) => void;
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
  onClick,
}: CourseCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => onClick(id);

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
        {imageError ? (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        ) : (
          <img
            src={imageUrl}
            alt={`Capa do curso ${title}`}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        )}

        <div className={styles.badgeLeft}>
          <Badge category={category} />
        </div>
        <div className={styles.badgeRight}>
          <Badge category={level} variant="neutral" />
        </div>
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
          <span className={styles.price}>{price}</span>
        </div>
      </div>
    </div>
  );
};
