import { Plus, Trash2 } from 'lucide-react';
import type { LessonQuizOptionDraft, LessonQuizQuestionDraft } from './lessonForm';
import { createQuizOption, createQuizQuestion } from './lessonForm';
import { FormField } from './FormField';
import styles from './LessonModal.module.css';

export interface LessonQuizEditorProps {
  idPrefix: string;
  questions: LessonQuizQuestionDraft[];
  error?: string;
  onChange: (questions: LessonQuizQuestionDraft[]) => void;
}

export const LessonQuizEditor = ({
  idPrefix,
  questions,
  error,
  onChange,
}: LessonQuizEditorProps) => {
  const updateQuestion = (questionId: string, patch: Partial<LessonQuizQuestionDraft>) => {
    onChange(
      questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question,
      ),
    );
  };

  const updateOption = (
    questionId: string,
    optionId: string,
    patch: Partial<LessonQuizOptionDraft>,
  ) => {
    onChange(
      questions.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          options: question.options.map((option) =>
            option.id === optionId ? { ...option, ...patch } : option,
          ),
        };
      }),
    );
  };

  const markCorrect = (questionId: string, optionId: string) => {
    onChange(
      questions.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          options: question.options.map((option) => ({
            ...option,
            correct: option.id === optionId,
          })),
        };
      }),
    );
  };

  return (
    <div className={styles.quizEditor}>
      <div className={styles.quizHeader}>
        <div>
          <p className={styles.quizTitle}>Perguntas do quiz</p>
          <p className={styles.quizHint}>
            Cada pergunta precisa de pelo menos duas alternativas e exatamente uma correta.
          </p>
        </div>
        <button
          type="button"
          className={styles.quizAddButton}
          onClick={() => onChange([...questions, createQuizQuestion()])}
        >
          <Plus size={16} aria-hidden="true" />
          Adicionar pergunta
        </button>
      </div>

      {error ? (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}

      {questions.length === 0 ? (
        <p className={styles.quizEmpty}>Nenhuma pergunta ainda. Adicione a primeira.</p>
      ) : null}

      {questions.map((question, questionIndex) => {
        const promptId = `${idPrefix}-q${questionIndex}-prompt`;
        return (
          <article key={question.id} className={styles.quizQuestion}>
            <div className={styles.quizQuestionHeader}>
              <h4>Pergunta {questionIndex + 1}</h4>
              <button
                type="button"
                className={styles.quizRemoveButton}
                aria-label={`Remover pergunta ${questionIndex + 1}`}
                onClick={() => onChange(questions.filter((item) => item.id !== question.id))}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>

            <FormField id={promptId} label="Enunciado" required>
              <textarea
                id={promptId}
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Digite a pergunta..."
                value={question.prompt}
                onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
              />
            </FormField>

            <div className={styles.quizOptions}>
              {question.options.map((option, optionIndex) => {
                const optionId = `${idPrefix}-q${questionIndex}-o${optionIndex}`;
                return (
                  <div key={option.id} className={styles.quizOptionRow}>
                    <label className={styles.quizCorrect}>
                      <input
                        type="radio"
                        name={`${idPrefix}-correct-${question.id}`}
                        checked={option.correct}
                        onChange={() => markCorrect(question.id, option.id)}
                        aria-label={`Marcar alternativa ${optionIndex + 1} como correta`}
                      />
                      Correta
                    </label>
                    <input
                      id={optionId}
                      type="text"
                      className={styles.input}
                      placeholder={`Alternativa ${optionIndex + 1}`}
                      value={option.text}
                      onChange={(event) =>
                        updateOption(question.id, option.id, { text: event.target.value })
                      }
                    />
                    <button
                      type="button"
                      className={styles.quizRemoveButton}
                      aria-label={`Remover alternativa ${optionIndex + 1}`}
                      disabled={question.options.length <= 2}
                      onClick={() =>
                        updateQuestion(question.id, {
                          options: question.options.filter((item) => item.id !== option.id),
                        })
                      }
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className={styles.quizAddOption}
                onClick={() =>
                  updateQuestion(question.id, {
                    options: [...question.options, createQuizOption(false)],
                  })
                }
              >
                <Plus size={14} aria-hidden="true" />
                Alternativa
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};
