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
  // Um item bloqueado só deve ser considerado bloqueado quando não é o atual.
  const isLocked = !isCurrent && status === 'LOCKED';
  const isCompleted = status === 'COMPLETED';

  // O estado disponível é o padrão; os próximos blocos substituem ícone e classe quando necessário.
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

  // O conteúdo é compartilhado entre o link acessível e a versão não interativa bloqueada.
  const content = (
    <>
      <Icon className={`icon ${stateClass}`} />
      <span className={`title ${stateClass}`} title={title}>
        {title}
      </span>
      <span className="duration">{durationMinutes} min</span>
    </>
  );

  // Aulas bloqueadas não recebem link para impedir navegação acidental.
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
