import { render, screen } from '@testing-library/react';
import { AboutUser } from './AboutUser';

describe('AboutUser', () => {
  it('shows who completed the course and when', () => {
    render(
      <AboutUser
        name="Jorge Amado"
        conclusionDate="21 de agosto de 2026"
        workload="16 horas"
        course="Marketing Digital para Hospitalidade"
      />,
    );

    expect(screen.getByText(/concluído por/i)).toBeInTheDocument();
    expect(screen.getByText('Jorge Amado')).toBeInTheDocument();
    expect(screen.getByText(/em 21 de agosto de 2026/)).toBeInTheDocument();
  });

  it('shows the workload and the course name in the summary', () => {
    render(
      <AboutUser
        name="Jorge Amado"
        conclusionDate="21 de agosto de 2026"
        workload="16 horas"
        course="Marketing Digital para Hospitalidade"
      />,
    );

    expect(screen.getByText(/16 horas \(aproximadamente\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/certifica a conclusão com sucesso de Marketing Digital para Hospitalidade/),
    ).toBeInTheDocument();
  });

  it('says the account is verified by default', () => {
    render(
      <AboutUser
        name="Jorge Amado"
        conclusionDate="21 de agosto de 2026"
        workload="16 horas"
        course="Curso"
      />,
    );

    expect(screen.getByText(/a conta de jorge amado é verificada/i)).toBeInTheDocument();
  });

  it('says the account is not verified when isVerified is false', () => {
    render(
      <AboutUser
        name="Jorge Amado"
        conclusionDate="21 de agosto de 2026"
        workload="16 horas"
        course="Curso"
        isVerified={false}
      />,
    );

    expect(screen.getByText(/a conta de jorge amado ainda não é verificada/i)).toBeInTheDocument();
  });
});
