import { render, screen } from '@testing-library/react';
import { AboutUser } from './AboutUser';

describe('AboutUser', () => {
  it('shows who completed the course and when', () => {
    render(
      <AboutUser
        name="Jorge Amado"
        conclusionDate="21 de agosto de 2026"
        workload="12h"
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
        workload="12h"
        course="IA Aplicada ao Turismo"
      />,
    );

    expect(
      screen.getByText(
        'A Escapa! certifica a conclusão com sucesso do curso de IA Aplicada ao Turismo pelo aluno, com carga horária aproximada de 12h.',
      ),
    ).toBeInTheDocument();
  });
});
