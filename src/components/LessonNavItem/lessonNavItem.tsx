import { Link } from 'react-router-dom';
import { CircleCheck, Play, Circle, Lock } from 'lucide-react';
import './lessonNavItem.css';

interface LessonNavItemProps {
  title: string;
  durationMinutes: number;
  status: 'COMPLETED' | 'AVAILABLE' | 'LOCKED';
  isCurrent?: boolean;
  href: string;
}

export function LessonNavItem({
  title,
  durationMinutes,
  status,
  isCurrent = false,
  href,
}: LessonNavItemProps) {
  const isLocked = !isCurrent && status === 'LOCKED';
  const isCompleted = status === 'COMPLETED';

  let stateClass = 'available';
  let Icon = Circle;

  if (isCurrent) {
    stateClass = 'current';
    Icon = Play;
  } else if (isCompleted) {
    stateClass = 'completed';
    Icon = CircleCheck;
  } else if (isLocked) {
    stateClass = 'locked';
    Icon = Lock;
  }

  const content = (
    <>
      <Icon className={`icon ${stateClass}`} />
      <span className={`title ${stateClass}`} title={title}>
        {title}
      </span>
      <span className="duration">{durationMinutes} min</span>
    </>
  );

  if (isLocked) {
    return (
      <div className={`lesson-nav-item ${stateClass}`} aria-disabled="true">
        {content}
      </div>
    );
  }
  return (
    <Link to={href} className={`lesson-nav-item ${stateClass}`}>
      {content}
    </Link>
  );
}
