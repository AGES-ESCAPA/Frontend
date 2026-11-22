import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@components/ui';
import type { StudentQuizQuestion } from '@/types/lesson';
import { submitStudentQuiz, type QuizSubmitResult } from '@services/lessonService';
import styles from './LessonQuizPlayer.module.css';

export interface LessonQuizPlayerProps {
  courseId: string;
  lessonId: string;
  questions: StudentQuizQuestion[];
  minPassPercentage: number;
  alreadyCompleted: boolean;
  onPassed: () => void;
}

export const LessonQuizPlayer = ({
  courseId,
  lessonId,
  questions,
  minPassPercentage,
  alreadyCompleted,
  onPassed,
}: LessonQuizPlayerProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((question) => Boolean(answers[question.id])),
    [answers, questions],
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        optionId: answers[question.id],
      }));
      const submitted = await submitStudentQuiz(courseId, lessonId, payload);
      setResult(submitted);
      if (submitted.passed) {
        onPassed();
      }
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível enviar o quiz. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError(null);
  };

  if (questions.length === 0) {
    return (
      <section className={styles.panel} aria-label="Quiz da aula">
        <p>Este quiz ainda não tem perguntas cadastradas.</p>
      </section>
    );
  }

  if (result) {
    return (
      <section className={styles.panel} aria-label="Resultado do quiz">
        <div className={result.passed ? styles.resultPass : styles.resultFail}>
          {result.passed ? (
            <CheckCircle2 size={28} aria-hidden="true" />
          ) : (
            <XCircle size={28} aria-hidden="true" />
          )}
          <div>
            <h2>{result.passed ? 'Quiz concluído' : 'Não atingiu o mínimo'}</h2>
            <p>
              Você acertou {result.correctCount} de {result.totalQuestions} ({result.scorePercent}
              %). O mínimo para concluir é {minPassPercentage}%.
            </p>
          </div>
        </div>

        {!result.passed ? (
          <Button
            label="Tentar novamente"
            variant="primary"
            icon={<RotateCcw size={16} aria-hidden="true" />}
            onClick={handleRetry}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="Quiz da aula">
      {alreadyCompleted ? (
        <p className={styles.completedHint}>
          Você já concluiu este quiz. Pode refazer para treinar, mas a aula permanece concluída.
        </p>
      ) : (
        <p className={styles.completedHint}>
          Responda todas as perguntas. A aula só é concluída com pelo menos {minPassPercentage}% de
          acertos.
        </p>
      )}

      <ol className={styles.questionList}>
        {questions.map((question, index) => (
          <li key={question.id} className={styles.question}>
            <p className={styles.prompt}>
              <span>{index + 1}.</span> {question.prompt}
            </p>
            <div className={styles.options} role="radiogroup" aria-label={`Pergunta ${index + 1}`}>
              {question.options.map((option) => {
                const inputId = `${question.id}-${option.id}`;
                return (
                  <label key={option.id} className={styles.option} htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === option.id}
                      onChange={() =>
                        setAnswers((current) => ({ ...current, [question.id]: option.id }))
                      }
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <Button
        label="Enviar respostas"
        variant="primary"
        isLoading={isSubmitting}
        disabled={!allAnswered || isSubmitting}
        onClick={() => void handleSubmit()}
      />
    </section>
  );
};
