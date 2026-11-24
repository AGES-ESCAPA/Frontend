import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createQuizQuestion } from './lessonForm';
import { LessonQuizEditor } from './LessonQuizEditor';

describe('LessonQuizEditor', () => {
  it('adds and removes questions and options through onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const initial = [createQuizQuestion()];

    const { rerender } = render(
      <LessonQuizEditor idPrefix="lesson" questions={initial} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar pergunta' }));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Object)]));

    const twoQuestions = [...initial, createQuizQuestion()];
    onChange.mockClear();
    rerender(<LessonQuizEditor idPrefix="lesson" questions={twoQuestions} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remover pergunta 2' }));
    expect(onChange).toHaveBeenCalledWith([initial[0]]);
  });

  it('shows a global validation error when provided', () => {
    render(
      <LessonQuizEditor
        idPrefix="lesson"
        questions={[]}
        error="Cada pergunta precisa de enunciado."
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Cada pergunta precisa de enunciado.');
  });
});
