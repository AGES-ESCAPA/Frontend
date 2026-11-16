import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

export interface StarRatingProps {
  /** Nota de 1 a 5; `null`/`undefined` = nenhuma estrela preenchida. */
  value?: number | null;
  /** Quando informado, as estrelas ficam clicáveis e chamam o callback. */
  onChange?: (rating: number) => void;
  /** Desabilita interação (ex.: enquanto salva). */
  disabled?: boolean;
  /** Tamanho visual das estrelas. */
  size?: 'sm' | 'md';
  /** Nome acessível do grupo (ex.: "Avaliar curso"). */
  label?: string;
  className?: string;
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

/**
 * Cinco estrelas: só leitura quando não há `onChange`, ou seleção quando há.
 */
export const StarRating = ({
  value = null,
  onChange,
  disabled = false,
  size = 'md',
  label = 'Avaliação',
  className = '',
}: StarRatingProps) => {
  const rating = value != null && value >= 1 && value <= 5 ? value : 0;
  const interactive = Boolean(onChange) && !disabled;

  if (!interactive) {
    return (
      <div
        className={`${styles.root} ${styles[size]} ${className}`.trim()}
        role="img"
        aria-label={rating > 0 ? `${label}: ${rating} de 5` : `${label}: sem nota`}
      >
        {STAR_VALUES.map((star) => (
          <Star
            key={star}
            className={`${styles.star} ${star <= rating ? styles.filled : styles.empty}`}
            aria-hidden="true"
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} ${styles[size]} ${styles.interactive} ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
    >
      {STAR_VALUES.map((star) => {
        const selected = star === rating;
        const filled = star <= rating;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
            className={`${styles.starButton} ${filled ? styles.filled : styles.empty}`}
            disabled={disabled}
            onClick={() => onChange?.(star)}
          >
            <Star aria-hidden="true" fill={filled ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
};
