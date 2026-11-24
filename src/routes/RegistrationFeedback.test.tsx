import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RegistrationFeedback } from './RegistrationFeedback';

const NavigateWithState = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() =>
        navigate('/destino?ref=1#ok', {
          state: { registrationSuccess: true, returnTo: '/meus-cursos' },
        })
      }
    >
      Concluir cadastro
    </button>
  );
};

const LocationStateDump = () => {
  const location = useLocation();
  return <output aria-label="estado">{JSON.stringify(location.state)}</output>;
};

describe('RegistrationFeedback', () => {
  it('não exibe toast quando o state não sinaliza sucesso', () => {
    render(
      <MemoryRouter initialEntries={['/destino']}>
        <RegistrationFeedback />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Cadastro realizado com sucesso!')).not.toBeInTheDocument();
  });

  it('mostra o toast de sucesso, limpa o flag e preserva o restante do state', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <RegistrationFeedback />
        <Routes>
          <Route path="/inicio" element={<NavigateWithState />} />
          <Route path="/destino" element={<LocationStateDump />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Concluir cadastro' }));

    expect(await screen.findByText('Cadastro realizado com sucesso!')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByLabelText('estado')).toHaveTextContent(
        JSON.stringify({ returnTo: '/meus-cursos' }),
      ),
    );
  });

  it('fecha o toast quando o usuário dispensa a notificação', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/destino',
            state: { registrationSuccess: true },
          },
        ]}
      >
        <RegistrationFeedback />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Cadastro realizado com sucesso!')).toBeInTheDocument();

    const dismiss = screen.getByRole('button', { name: 'Fechar notificação' });
    await user.click(dismiss);

    await waitFor(() =>
      expect(screen.queryByText('Cadastro realizado com sucesso!')).not.toBeInTheDocument(),
    );
  });
});
