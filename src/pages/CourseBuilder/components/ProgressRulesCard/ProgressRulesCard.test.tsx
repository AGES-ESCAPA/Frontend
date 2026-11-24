import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CourseProgressRules } from '@/types/course';
import { ProgressRulesCard } from './ProgressRulesCard';

const rules: CourseProgressRules = {
  requireSequentialProgress: true,
  blockAccessAfterDeadline: false,
  minQuizPassPercentage: 70,
};

describe('ProgressRulesCard', () => {
  it('toggles progress rules and clamps the quiz percentage', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ProgressRulesCard rules={rules} onChange={onChange} />);

    await user.click(
      screen.getByRole('checkbox', {
        name: /bloquear acesso após expiração do prazo/i,
      }),
    );
    expect(onChange).toHaveBeenCalledWith('blockAccessAfterDeadline', true);

    const percentInput = screen.getByLabelText(/percentual mínimo de acerto para concluir o quiz/i);
    await user.clear(percentInput);
    await user.type(percentInput, '150');

    const percentCalls = onChange.mock.calls.filter((call) => call[0] === 'minQuizPassPercentage');
    expect(percentCalls.at(-1)).toEqual(['minQuizPassPercentage', 100]);
  });
});
