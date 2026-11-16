import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rateCourse } from '@services/courseReviewService';
import { CourseRatingModal } from './CourseRatingModal';

vi.mock('@services/courseReviewService', () => ({
  rateCourse: vi.fn(),
  CourseReviewError: class CourseReviewError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'CourseReviewError';
      this.status = status;
    }
  },
}));

const rateCourseMock = vi.mocked(rateCourse);

describe('CourseRatingModal', () => {
  beforeEach(() => {
    rateCourseMock.mockReset();
  });

  it('submits the selected rating and notifies the parent', async () => {
    const user = userEvent.setup();
    const onRated = vi.fn();
    const onOpenChange = vi.fn();
    rateCourseMock.mockResolvedValue({ courseId: 'course-1', rating: 5 });

    render(
      <CourseRatingModal
        open
        onOpenChange={onOpenChange}
        courseId="course-1"
        courseTitle="IA Aplicada ao Turismo"
        onRated={onRated}
      />,
    );

    expect(screen.getByText(/IA Aplicada ao Turismo/)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: '5 estrelas' }));
    await user.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(rateCourseMock).toHaveBeenCalledWith('course-1', 5));
    expect(onRated).toHaveBeenCalledWith(5);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onSkip when the student chooses to rate later', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <CourseRatingModal open onOpenChange={onOpenChange} courseId="course-1" onSkip={onSkip} />,
    );

    await user.click(screen.getByRole('button', { name: 'Avaliar depois' }));

    expect(onSkip).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(rateCourseMock).not.toHaveBeenCalled();
  });
});
