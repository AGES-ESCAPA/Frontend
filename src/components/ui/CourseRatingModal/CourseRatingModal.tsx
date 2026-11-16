import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { StarRating } from '../StarRating';
import { rateCourse, CourseReviewError } from '@services/courseReviewService';
import styles from './CourseRatingModal.module.css';

export interface CourseRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle?: string;
  /** Chamado após salvar com sucesso, com a nota enviada. */
  onRated?: (rating: number) => void;
  /** Chamado quando o aluno fecha ou escolhe avaliar depois (sem salvar). */
  onSkip?: () => void;
}

/**
 * Pop-up para o aluno avaliar um curso concluído com 1 a 5 estrelas.
 */
export const CourseRatingModal = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  onRated,
  onSkip,
}: CourseRatingModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didRateRef = useRef(false);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setError(null);
      setIsSubmitting(false);
      didRateRef.current = false;
    }
  }, [open, courseId]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen && !didRateRef.current) onSkip?.();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selected == null) {
      setError('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await rateCourse(courseId, selected);
      didRateRef.current = true;
      onRated?.(result.rating);
      onOpenChange(false);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof CourseReviewError
          ? submitError.message
          : 'Não foi possível salvar a avaliação. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtitle = courseTitle
    ? `Como foi sua experiência em “${courseTitle}”?`
    : 'Como foi sua experiência neste curso?';

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Avalie o curso"
      subtitle={subtitle}
      icon={<Star size={20} aria-hidden="true" />}
      size="sm"
      onSubmit={(event) => void handleSubmit(event)}
      footer={
        <>
          <Button
            type="button"
            label="Avaliar depois"
            variant="ghost-dark"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          />
          <Button
            type="submit"
            label="Enviar avaliação"
            variant="primary"
            isLoading={isSubmitting}
            disabled={selected == null}
          />
        </>
      }
    >
      <div className={styles.body}>
        <StarRating
          value={selected}
          onChange={setSelected}
          disabled={isSubmitting}
          label="Nota do curso"
          size="md"
          className={styles.stars}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
};
