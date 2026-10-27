import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { useAuth } from '@contexts/useAuth';
import { authService, AuthServiceError } from '@services/authService';
import { setUnauthorizedHandler } from '@services/api';
import type { StudentRegistrationSession } from '@/types/auth';
import { RegisterAccountType } from '@pages/RegisterAccountType/RegisterAccountType';
import { Login } from '@pages/Login/Login';
import { RegistrationFeedback } from '@routes/RegistrationFeedback';
import { RegisterIndividual } from './RegisterIndividual';

const session: StudentRegistrationSession = {
  token: 'student-registration-token',
  expiresIn: 120,
  user: { id: 'student-21', name: 'Maria da Silva', email: 'maria@exemplo.com', role: 'STUDENT' },
};
const values = {
  name: 'Maria da Silva',
  cpf: '52998224725',
  email: 'maria@exemplo.com',
  password: 'senha segura',
  confirmPassword: 'senha segura',
};
const Destination = () => {
  const location = useLocation();
  const { user } = useAuth();
  return (
    <>
      <output aria-label="Destino">{`${location.pathname}${location.search}${location.hash}`}</output>
      <output aria-label="Usuário conectado">{user?.name ?? 'Sem sessão'}</output>
    </>
  );
};
const renderPage = (
  entry: string | { pathname: string; state: { returnTo: string } } = '/cadastro/usuario',
) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <RegistrationFeedback />
        <Routes>
          <Route path="/cadastro/usuario" element={<RegisterIndividual />} />
          <Route path="/cadastro" element={<RegisterAccountType />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<typeof values> = {},
) => {
  const next = { ...values, ...overrides };
  for (const [label, value] of [
    ['Nome completo', next.name],
    ['CPF', next.cpf],
    ['E-mail', next.email],
    ['Senha', next.password],
    ['Confirmar senha', next.confirmPassword],
  ]) {
    await user.click(screen.getByLabelText(label, { exact: true }));
    await user.paste(value);
  }
};

describe('RegisterIndividual', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(authService, 'registerStudent').mockResolvedValue(session);
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(session.user);
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    setUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  it('renders the public form with six accessible fields, optional phone and both password controls', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: 'Cadastro · Aluno individual' }),
    ).toBeInTheDocument();
    for (const label of ['Nome completo', 'CPF', 'E-mail', 'Senha', 'Confirmar senha'])
      expect(screen.getByLabelText(label, { exact: true })).toBeRequired();
    expect(screen.getByLabelText('Telefone / WhatsApp')).not.toBeRequired();
    expect(screen.getAllByRole('button', { name: 'Mostrar senha' })).toHaveLength(2);
    expect(screen.getByLabelText('Senha', { exact: true })).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByLabelText('Confirmar senha')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
  });

  it('focuses the first missing field and associates its error without sending the form', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(authService.registerStudent).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nome completo')).toHaveFocus();
    expect(screen.getByLabelText('Nome completo')).toHaveAccessibleDescription(
      'Informe seu nome completo.',
    );
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true');
  });

  it('masks pasted CPF/phone and validates CPF and email during editing', async () => {
    const user = userEvent.setup();
    renderPage();
    const cpf = screen.getByLabelText('CPF');
    await user.click(cpf);
    await user.paste('11111111111');
    expect(cpf).toHaveValue('111.111.111-11');
    expect(cpf).toHaveAccessibleDescription('Informe um CPF válido.');
    await user.clear(cpf);
    await user.paste('52998224725');
    expect(cpf).toHaveValue('529.982.247-25');
    expect(cpf).not.toHaveAttribute('aria-invalid');
    const email = screen.getByLabelText('E-mail');
    await user.type(email, 'maria@');
    expect(email).toHaveAccessibleDescription('Informe um e-mail válido.');
    await user.type(email, 'exemplo.com');
    expect(email).not.toHaveAttribute('aria-invalid');
    const phone = screen.getByLabelText('Telefone / WhatsApp');
    await user.click(phone);
    await user.paste('(51) 99999-0000');
    expect(phone).toHaveValue('(51) 99999-0000');
  });

  it('toggles both passwords independently and keeps keyboard access to the controls', async () => {
    const user = userEvent.setup();
    renderPage();
    const password = screen.getByLabelText('Senha', { exact: true });
    const confirm = screen.getByLabelText('Confirmar senha');
    await user.click(password);
    await user.tab();
    expect(screen.getAllByRole('button', { name: 'Mostrar senha' })[0]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(password).toHaveAttribute('type', 'text');
    expect(confirm).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(confirm).toHaveAttribute('type', 'text');
    await user.click(screen.getAllByRole('button', { name: 'Ocultar senha' })[0]);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('blocks differing passwords and revalidates the confirmation when the password changes', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user, { confirmPassword: 'outra senha' });
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(authService.registerStudent).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Confirmar senha')).toHaveAccessibleDescription(
      'As senhas devem ser iguais.',
    );
    await user.clear(screen.getByLabelText('Senha', { exact: true }));
    await user.paste('outra senha');
    expect(screen.getByLabelText('Confirmar senha')).not.toHaveAttribute('aria-invalid');
  });

  it('registers without phone, starts the session with the received lifetime and goes to the student catalog', async () => {
    const user = userEvent.setup();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Destino')).toHaveTextContent('/aluno/cursos'),
    );
    expect(screen.getByLabelText('Usuário conectado')).toHaveTextContent('Maria da Silva');
    expect(localStorage.getItem('access_token')).toBe(session.token);
    expect(localStorage.getItem('access_token_expires_at')).toBe(String(now + 120_000));
    expect(screen.getByText('Cadastro realizado com sucesso!')).toBeInTheDocument();
    expect(authService.registerStudent).toHaveBeenCalledWith(
      {
        name: values.name,
        cpf: values.cpf,
        email: values.email,
        password: values.password,
        phone: '',
      },
      expect.any(AbortSignal),
    );
  });

  it('prioritizes the state return destination and clears a pending purchase after success', async () => {
    const user = userEvent.setup();
    localStorage.setItem('escapa:purchase-redirect', '/cursos/another-course');
    renderPage({
      pathname: '/cadastro/usuario',
      state: { returnTo: '/cursos/original?turma=1#conteudo' },
    });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Destino')).toHaveTextContent(
        '/cursos/original?turma=1#conteudo',
      ),
    );
    expect(localStorage.getItem('escapa:purchase-redirect')).toBeNull();
  });

  it('returns to a saved purchase when there is no route state', async () => {
    const user = userEvent.setup();
    localStorage.setItem('escapa:purchase-redirect', '/cursos/saved-course');
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Destino')).toHaveTextContent('/cursos/saved-course'),
    );
  });

  it('preserves the course when going back to account type and when switching to login', async () => {
    const user = userEvent.setup();
    renderPage({ pathname: '/cadastro/usuario', state: { returnTo: '/cursos/original' } });
    await user.click(screen.getByRole('link', { name: 'Voltar' }));
    expect(screen.getByRole('link', { name: 'Pessoa Física' })).toHaveAttribute(
      'href',
      '/cadastro/usuario?returnTo=%2Fcursos%2Foriginal',
    );
    await user.click(screen.getByRole('link', { name: 'Pessoa Física' }));
    await user.click(screen.getByRole('link', { name: 'Entrar' }));
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/cadastro?returnTo=%2Fcursos%2Foriginal',
    );
  });

  it.each([
    {
      field: 'email',
      label: 'E-mail',
      message: 'Este e-mail já está cadastrado. Entre na sua conta.',
    },
    { field: 'cpf', label: 'CPF', message: 'Este CPF já está cadastrado.' },
  ])(
    'shows the 409 conflict in $field, focuses it and preserves all fields',
    async ({ field, label, message }) => {
      const user = userEvent.setup();
      vi.mocked(authService.registerStudent).mockRejectedValue(
        new AuthServiceError(409, 'Revise os campos destacados.', { [field]: message }),
      );
      renderPage();
      await fillForm(user);
      await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
      await waitFor(() =>
        expect(screen.getByLabelText(label)).toHaveAccessibleDescription(message),
      );
      expect(screen.getByLabelText(label)).toHaveFocus();
      expect(screen.getByLabelText('Nome completo')).toHaveValue(values.name);
      expect(screen.getByLabelText('Senha', { exact: true })).toHaveValue(values.password);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    },
  );

  it('shows a network toast, preserves the form and allows a manual retry', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.registerStudent).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(
      await screen.findByText(
        'Verifique sua conexão. Seus dados foram mantidos. Se o cadastro foi concluído, tente entrar na sua conta.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25');
    expect(screen.getByLabelText('E-mail')).toHaveValue(values.email);
    expect(screen.getByLabelText('Confirmar senha')).toHaveValue(values.confirmPassword);
    expect(authService.registerStudent).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Destino')).toHaveTextContent('/aluno/cursos'),
    );
    expect(authService.registerStudent).toHaveBeenCalledTimes(2);
  });

  it('shows an API 400 message without confirming success', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.registerStudent).mockRejectedValue(
      new AuthServiceError(400, 'Dados de cadastro incompatíveis.'),
    );
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Dados de cadastro incompatíveis.');
    expect(screen.getByLabelText('Nome completo')).toHaveValue(values.name);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('blocks duplicate submissions while the request is pending', async () => {
    const user = userEvent.setup();
    let resolveRequest: (value: StudentRegistrationSession) => void = () => {};
    vi.mocked(authService.registerStudent).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    renderPage();
    await fillForm(user);
    await user.dblClick(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByRole('button', { name: 'Cadastrando...' })).toBeDisabled();
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    expect(authService.registerStudent).toHaveBeenCalledTimes(1);
    await act(async () => resolveRequest(session));
    await waitFor(() =>
      expect(screen.getByLabelText('Destino')).toHaveTextContent('/aluno/cursos'),
    );
  });
});
