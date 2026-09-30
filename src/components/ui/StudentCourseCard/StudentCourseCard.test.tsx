import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentCourseCard, type StudentCourseCardProps } from './StudentCourseCard';
import styles from './StudentCourseCard.module.css';

const baseProps: StudentCourseCardProps = {
  courseId: 'b2c3d4e5-1111-2222-3333-444455556666',
  title: 'Marketing Digital para Hospitalidade',
  thumbnailUrl: '/course-cover.jpg',
  instructor: 'Paulo Henrique',
  durationTime: 16,
  lessonsCount: 44,
  progressPercentage: 45,
  enrollmentStatus: 'IN_PROGRESS',
};

describe('StudentCourseCard', () => {
  it('renders the required course data without optional catalog fields', () => {
    render(<StudentCourseCard {...baseProps} />);

    expect(screen.getByRole('heading', { name: baseProps.title })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: `Capa do curso ${baseProps.title}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Paulo Henrique/)).toBeInTheDocument();
    expect(screen.getByText('16h · 44 aulas')).toBeInTheDocument();
  });

  it('shows exact progress and forwards the continue action', async () => {
    const onAction = vi.fn();
    render(<StudentCourseCard {...baseProps} onAction={onAction} />);

    expect(screen.getByRole('progressbar', { name: /Progresso do curso/ })).toHaveAttribute(
      'aria-valuenow',
      '45',
    );
    expect(screen.getByText('45%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continuar Aula' }));
    expect(onAction).toHaveBeenCalledWith(baseProps.courseId, 'IN_PROGRESS');
  });

  it('renders optional category and description when the page provides them', () => {
    render(
      <StudentCourseCard
        {...baseProps}
        category="MARKETING"
        description="Estratégias de marketing para hotelaria"
      />,
    );

    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Estratégias de marketing para hotelaria')).toBeInTheDocument();
  });

  it('shows the certificate action and full progress for completed courses', async () => {
    const onAction = vi.fn();
    render(
      <StudentCourseCard
        {...baseProps}
        enrollmentStatus="COMPLETED"
        progressPercentage={100}
        onAction={onAction}
      />,
    );

    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Visualizar Certificado' }));
    expect(onAction).toHaveBeenCalledWith(baseProps.courseId, 'COMPLETED');
  });

  it('visually blocks pending courses and prevents any action', async () => {
    const onAction = vi.fn();
    render(<StudentCourseCard {...baseProps} enrollmentStatus="PENDING" onAction={onAction} />);

    expect(screen.getByRole('article')).toHaveClass(styles.pending);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Aguardando' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onAction).not.toHaveBeenCalled();
  });

  it.each([
    { value: 0, expected: '0' },
    { value: -12, expected: '0' },
    { value: 140, expected: '100' },
  ])('clamps invalid progress $value to $expected', ({ value, expected }) => {
    render(<StudentCourseCard {...baseProps} progressPercentage={value} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', expected);
    expect(screen.getByText(`${expected}%`)).toBeInTheDocument();
  });
});
