import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmployeeManagement } from './EmployeeManagement';

describe('EmployeeManagement', () => {
  it('opens the create form and locally adds a pending demo employee', async () => {
    render(
      <MemoryRouter>
        <EmployeeManagement />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Nome completo/ }), {
      target: { value: 'Joana Lima' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /E-mail corporativo/ }), {
      target: { value: 'joana@empresa.com.br' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Cargo/ }), {
      target: { value: 'Supervisora' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Joana Lima')).toBeInTheDocument();
    expect(screen.getByText('joana@empresa.com.br')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhum dado foi enviado ou salvo no backend.',
    );
  });

  it('opens pending employee edit and explains that invitations are not sent', async () => {
    render(
      <MemoryRouter>
        <EmployeeManagement />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Reenviar convite para Ana Costa (exemplo)' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Convite não enviado: a integração de convites com o backend ainda não está disponível.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana Costa (exemplo)' }));
    expect(await screen.findByRole('dialog', { name: 'Editar Colaborador' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Status do acesso/ })).toHaveValue('PENDING');
  });
});
