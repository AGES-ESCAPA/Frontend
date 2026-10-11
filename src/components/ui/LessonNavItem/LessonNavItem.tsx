import { Check, Circle, Play, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './LessonNavItem.module.css';

export type LessonStatus = 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

export interface LessonNavItemProps {
  title: string;
  durationMinutes: number;
  status: LessonStatus;
  isCurrent?: boolean;
  href: string;
}

const STATUS_ICON: Record<LessonStatus, LucideIcon> = {
  COMPLETED: Check,
  AVAILABLE: Circle,
  LOCKED: Circle,
};

const ICON_SIZE = 18;
const BADGE_ICON_SIZE = 12;

export const LessonNavItem = ({
  title,
  durationMinutes,
  status,
  isCurrent = false,
  href,
}: LessonNavItemProps) => {
  const isLocked = status === 'LOCKED';
  const visualState = isCurrent ? 'current' : status.toLowerCase();
  const Icon = isCurrent ? Play : STATUS_ICON[status];
  const duration = `${durationMinutes} min`;
  const hasBadge = isCurrent || status === 'COMPLETED';

  const className = `${styles.item} ${styles[visualState]}`;

  const content = (
    <>
      <span className={hasBadge ? styles.iconBadge : styles.icon}>
        <Icon
          size={hasBadge ? BADGE_ICON_SIZE : ICON_SIZE}
          fill={isCurrent ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      </span>
      <span className={styles.title} title={title}>
        {title}
      </span>
      <span className={styles.duration}>{duration}</span>
    </>
  );

  if (isLocked) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link to={href} className={className} aria-current={isCurrent ? 'page' : undefined}>
      {content}
    </Link>
  );
};
