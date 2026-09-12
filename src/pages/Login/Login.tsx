import { useLocation } from 'react-router-dom';

interface LoginLocationState {
  returnTo?: string;
}

export const Login = () => {
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const returnTo = state?.returnTo ?? localStorage.getItem('escapa:purchase-redirect') ?? '/';

  return (
    <main>
      <h1>Login</h1>
      <p>Faça login para continuar sua matrícula.</p>
      <p data-testid="purchase-return-to">Retorno: {returnTo}</p>
    </main>
  );
};
