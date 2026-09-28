import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseCompletionMessage } from './CourseCompletionMessage';

describe('CourseCompletionMessage', () => {
  it('shows the completed course name', () => {
    render(
      <CourseCompletionMessage
        courseTitle="Experiências Imersivas na Prática"
        onViewOtherCourses={vi.fn()}
        onViewCertificate={vi.fn()}
      />,
    );

    expect(screen.getByText(/parabéns/i)).toBeInTheDocument();
    expect(screen.getByText('Experiências Imersivas na Prática')).toBeInTheDocument();
  });

  it('calls onViewOtherCourses when that button is clicked', async () => {
    const onViewOtherCourses = vi.fn();

    render(
      <CourseCompletionMessage
        courseTitle="Curso"
        onViewOtherCourses={onViewOtherCourses}
        onViewCertificate={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver Outros Cursos' }));

    expect(onViewOtherCourses).toHaveBeenCalledOnce();
  });

  it('calls onViewCertificate when that button is clicked', async () => {
    const onViewCertificate = vi.fn();

    render(
      <CourseCompletionMessage
        courseTitle="Curso"
        onViewOtherCourses={vi.fn()}
        onViewCertificate={onViewCertificate}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver Certificado' }));

    expect(onViewCertificate).toHaveBeenCalledOnce();
  });
});
