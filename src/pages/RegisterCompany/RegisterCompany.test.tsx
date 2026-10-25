import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthServiceError, DuplicateRegistrationError, authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { RegisterCompany } from './RegisterCompany';

const manager: AuthUser = {
  id: 'company-1',
  name: 'Maria Oliveira',
  email: 'contato@empresa.com.br',
  role: 'COMPANY',
};

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderRegisterCompany = () =>
  render(
    <MemoryRouter initialEntries={['/cadastro/empresa']}>
      <AuthProvider>
        <RegisterCompany />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );

const fillValidForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: { confirmation?: string; cnpj?: string } = {},
) => {
  await user.type(screen.getByLabelText('Nome do responsável'), 'Maria Oliveira');
  await user.type(screen.getByLabelText('CNPJ'), overrides.cnpj ?? '11222333000181');
  await user.type(screen.getByLabelText('Razão social / Nome fantasia'), 'Empresa Ltda.');
  await user.type(screen.getByLabelText('E-mail corporativo'), 'contato@empresa.com.br');
  await user.type(screen.getByLabelText('Telefone corporativo'), '1130000000');
  await user.type(screen.getByLabelText('Senha'), 'senha-segura');
  await user.type(
    screen.getByLabelText('Confirmar senha'),
    overrides.confirmation ?? 'senha-segura',
  );
};

describe('RegisterCompany', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders every registration field and the login link', () => {
    renderRegisterCompany();

    expect(screen.getByRole('heading', { name: 'Cadastro · Empresa' })).toBeInTheDocument();
    [
      'Nome do responsável',
      'CNPJ',
      'Razão social / Nome fantasia',
      'E-mail corporativo',
      'Telefone corporativo',
      'Senha',
      'Confirmar senha',
    ].forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('masks the CNPJ and the phone while typing', async () => {
    const user = userEvent.setup();
    renderRegisterCompany();

    await user.type(screen.getByLabelText('CNPJ'), '11222333000181');
    await user.type(screen.getByLabelText('Telefone corporativo'), '1130000000');

    expect(screen.getByLabelText('CNPJ')).toHaveValue('11.222.333/0001-81');
    expect(screen.getByLabelText('Telefone corporativo')).toHaveValue('(11) 3000-0000');
  });

  it('toggles the visibility of each password field independently', async () => {
    const user = userEvent.setup();
    renderRegisterCompany();

    const [showPassword, showConfirmation] = screen.getAllByRole('button', {
      name: 'Mostrar senha',
    });

    await user.click(showPassword);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Confirmar senha')).toHaveAttribute('type', 'password');

    await user.click(showConfirmation);

    expect(screen.getByLabelText('Confirmar senha')).toHaveAttribute('type', 'text');
  });

  it('does not submit a CNPJ with invalid check digits', async () => {
    const user = userEvent.setup();
    const registerCompany = vi.spyOn(authService, 'registerCompany');
    renderRegisterCompany();

    await fillValidForm(user, { cnpj: '11222333000182' });
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um CNPJ válido.');
    expect(screen.getByLabelText('CNPJ')).toHaveAttribute('aria-invalid', 'true');
    expect(registerCompany).not.toHaveBeenCalled();
  });

  it('does not submit when the password confirmation differs', async () => {
    const user = userEvent.setup();
    const registerCompany = vi.spyOn(authService, 'registerCompany');
    renderRegisterCompany();

    await fillValidForm(user, { confirmation: 'outra-senha' });
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('As senhas não coincidem.');
    expect(registerCompany).not.toHaveBeenCalled();
  });

  it('logs the manager in and opens the company panel after registering', async () => {
    const user = userEvent.setup();
    const registerCompany = vi
      .spyOn(authService, 'registerCompany')
      .mockResolvedValue({ token: 'jwt-token', user: manager });
    renderRegisterCompany();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/empresa/colaboradores'),
    );
    expect(localStorage.getItem('access_token')).toBe('jwt-token');
    expect(registerCompany).toHaveBeenCalledWith({
      responsibleName: 'Maria Oliveira',
      cnpj: '11222333000181',
      companyName: 'Empresa Ltda.',
      email: 'contato@empresa.com.br',
      phone: '1130000000',
      password: 'senha-segura',
    });
  });

  it('shows a CNPJ that is already registered on the CNPJ field', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'registerCompany').mockRejectedValue(
      new DuplicateRegistrationError('cnpj', 'cnpj already registered'),
    );
    renderRegisterCompany();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este CNPJ já está cadastrado.');
    expect(screen.getByLabelText('CNPJ')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('E-mail corporativo')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByTestId('location')).toHaveTextContent('/cadastro/empresa');
  });

  it('shows an e-mail that is already registered on the e-mail field', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'registerCompany').mockRejectedValue(
      new DuplicateRegistrationError('email', 'email already registered'),
    );
    renderRegisterCompany();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado.');
    expect(screen.getByLabelText('E-mail corporativo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('CNPJ')).not.toHaveAttribute('aria-invalid');
  });

  it('shows a generic message when the registration fails for another reason', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'registerCompany').mockRejectedValue(
      new AuthServiceError(500, 'Internal Server Error'),
    );
    renderRegisterCompany();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir o cadastro. Tente novamente.',
    );
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('shows the API message in the form when the registration is rejected with 400', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'registerCompany').mockRejectedValue(
      new AuthServiceError(400, 'cnpj is invalid'),
    );
    renderRegisterCompany();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('cnpj is invalid');
  });

  it('shows a toast and keeps the typed data on a network failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'registerCompany').mockRejectedValue(new TypeError('Failed to fetch'));
    renderRegisterCompany();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Falha de conexão')).toBeInTheDocument();
    expect(screen.getByLabelText('CNPJ')).toHaveValue('11.222.333/0001-81');
    expect(screen.getByLabelText('E-mail corporativo')).toHaveValue('contato@empresa.com.br');
  });
});
