import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentQuizQuestion } from '@/types/lesson';
import { submitStudentQuiz, type QuizSubmitResult } from '@services/lessonService';
import { LessonQuizPlayer } from './LessonQuizPlayer';

vi.mock('@services/lessonService', () => ({
  submitStudentQuiz: vi.fn(),
}));

const submitStudentQuizMock = vi.mocked(submitStudentQuiz);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';
const LESSON_ID = '02000000-0000-4000-9000-000000000182';

const questions: StudentQuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Qual é a capital do Brasil?',
    options: [
      { id: 'o1', text: 'Brasília' },
      { id: 'o2', text: 'Rio de Janeiro' },
    ],
  },
  {
    id: 'q2',
    prompt: 'Quantos estados tem o Brasil?',
    options: [
      { id: 'o3', text: '26' },
      { id: 'o4', text: '27' },
    ],
  },
];

const defaultProps = {
  courseId: COURSE_ID,
  lessonId: LESSON_ID,
  questions,
  minPassPercentage: 70,
  alreadyCompleted: false,
  onPassed: vi.fn(),
};

const passedResult: QuizSubmitResult = {
  passed: true,
  scorePercent: 100,
  correctCount: 2,
  totalQuestions: 2,
};

const failedResult: QuizSubmitResult = {
  passed: false,
  scorePercent: 50,
  correctCount: 1,
  totalQuestions: 2,
};

describe('LessonQuizPlayer', () => {
  beforeEach(() => {
    submitStudentQuizMock.mockReset();
    defaultProps.onPassed.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a message when there are no questions', () => {
    render(<LessonQuizPlayer {...defaultProps} questions={[]} />);

    expect(screen.getByRole('region', { name: 'Quiz da aula' })).toHaveTextContent(
      /ainda não tem perguntas cadastradas/i,
    );
  });

  it('keeps submit disabled until every question is answered', async () => {
    const user = userEvent.setup();
    render(<LessonQuizPlayer {...defaultProps} />);

    const submit = screen.getByRole('button', { name: /enviar respostas/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /brasília/i }));
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /^27$/i }));
    expect(submit).toBeEnabled();
  });

  it('calls onPassed when the quiz is submitted with a passing score', async () => {
    const user = userEvent.setup();
    submitStudentQuizMock.mockResolvedValue(passedResult);

    render(<LessonQuizPlayer {...defaultProps} />);

    await user.click(screen.getByRole('radio', { name: /brasília/i }));
    await user.click(screen.getByRole('radio', { name: /^27$/i }));
    await user.click(screen.getByRole('button', { name: /enviar respostas/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Resultado do quiz' })).toHaveTextContent(
        /quiz concluído/i,
      ),
    );

    expect(submitStudentQuizMock).toHaveBeenCalledWith(COURSE_ID, LESSON_ID, [
      { questionId: 'q1', optionId: 'o1' },
      { questionId: 'q2', optionId: 'o4' },
    ]);
    expect(defaultProps.onPassed).toHaveBeenCalledTimes(1);
  });

  it('shows retry when the score is below the minimum', async () => {
    const user = userEvent.setup();
    submitStudentQuizMock.mockResolvedValue(failedResult);

    render(<LessonQuizPlayer {...defaultProps} />);

    await user.click(screen.getByRole('radio', { name: /brasília/i }));
    await user.click(screen.getByRole('radio', { name: /^27$/i }));
    await user.click(screen.getByRole('button', { name: /enviar respostas/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Resultado do quiz' })).toHaveTextContent(
        /não atingiu o mínimo/i,
      ),
    );

    expect(defaultProps.onPassed).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('resets the quiz when the user chooses to try again', async () => {
    const user = userEvent.setup();
    submitStudentQuizMock.mockResolvedValue(failedResult);

    render(<LessonQuizPlayer {...defaultProps} />);

    await user.click(screen.getByRole('radio', { name: /brasília/i }));
    await user.click(screen.getByRole('radio', { name: /^27$/i }));
    await user.click(screen.getByRole('button', { name: /enviar respostas/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(screen.getByRole('region', { name: 'Quiz da aula' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar respostas/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /brasília/i })).not.toBeChecked();
  });

  it('shows the API error message when submit fails', async () => {
    const user = userEvent.setup();
    submitStudentQuizMock.mockRejectedValue(new Error('Quiz indisponível.'));

    render(<LessonQuizPlayer {...defaultProps} />);

    await user.click(screen.getByRole('radio', { name: /brasília/i }));
    await user.click(screen.getByRole('radio', { name: /^27$/i }));
    await user.click(screen.getByRole('button', { name: /enviar respostas/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Quiz indisponível.');
    expect(defaultProps.onPassed).not.toHaveBeenCalled();
  });
});
