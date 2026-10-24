import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthContextValue } from '@contexts/authContextDefinition';
import { profileService } from '@services/profileService';
import type { AuthUser } from '@/types/auth';
import type { UserProfile } from '@/types/profile';
import { Profile } from './Profile';

vi.mock('@services/profileService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    profileService: {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      deactivateAccount: vi.fn(),
    },
  };
});

const getProfileMock = vi.mocked(profileService.getProfile);
const updateProfileMock = vi.mocked(profileService.updateProfile);
const deactivateAccountMock = vi.mocked(profileService.deactivateAccount);

const studentUser: AuthUser = {
  id: 'b1',
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  role: 'STUDENT',
};

const studentProfile: UserProfile = {
  profile: 'STUDENT',
  editable: true,
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  cpf: '39011122233',
  phone: '51991203344',
  companyName: null,
  cnpj: null,
  avatarUrl: null,
};

const LocationProbe = () => <output>{useLocation().pathname}</output>;

const renderPage = (user: AuthUser, path = '/meu-perfil') => {
  const context: AuthContextValue = {
    user,
    isAuthenticated: true,
    isRestoring: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
  render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/meu-perfil" element={<Profile />} />
          <Route path="/empresa/perfil" element={<Profile />} />
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return context;
};

describe('Profile', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the loading state and then the student profile with the danger zone', async () => {
    getProfileMock.mockResolvedValue(studentProfile);
    renderPage(studentUser);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando seus dados...');
    expect(await screen.findByLabelText(/Nome Completo/)).toHaveValue('Mariana Costa');
    expect(screen.getByRole('heading', { level: 1, name: 'Meu Perfil' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Zona de Perigo' })).toBeInTheDocument();
  });

  it('hides the danger zone from company employees', async () => {
    getProfileMock.mockResolvedValue({
      ...studentProfile,
      profile: 'EMPLOYEE',
      editable: false,
      companyName: 'Pousada Vista Mar LTDA',
    });
    renderPage(studentUser);

    expect(await screen.findByText('Pousada Vista Mar LTDA')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Zona de Perigo' })).not.toBeInTheDocument();
  });

  it('uses the company title and marks the company profile in the menu', async () => {
    getProfileMock.mockResolvedValue({
      ...studentProfile,
      profile: 'COMPANY',
      cpf: null,
      companyName: 'Pousada Vista Mar LTDA',
      cnpj: '12345678000191',
    });
    renderPage({ ...studentUser, role: 'COMPANY' }, '/empresa/perfil');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Perfil da Empresa' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Perfil da Empresa/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the load error and tries again', async () => {
    getProfileMock
      .mockRejectedValueOnce(new Error('Não foi possível carregar seus dados.'))
      .mockResolvedValue(studentProfile);
    renderPage(studentUser);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar seus dados.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Tentar Novamente' }));

    expect(await screen.findByLabelText(/Nome Completo/)).toHaveValue('Mariana Costa');
  });

  it('updates the session user after saving so the navbar shows the new name', async () => {
    getProfileMock.mockResolvedValue(studentProfile);
    updateProfileMock.mockResolvedValue({ ...studentProfile, name: 'Mariana Souza' });
    const context = renderPage(studentUser);

    const name = await screen.findByLabelText(/Nome Completo/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Mariana Souza');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(context.updateUser).toHaveBeenCalledWith({ name: 'Mariana Souza', avatarUrl: null }),
    );
  });

  it('ends the session and goes to the login after deactivating the account', async () => {
    getProfileMock.mockResolvedValue(studentProfile);
    deactivateAccountMock.mockResolvedValue();
    const context = renderPage(studentUser);

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar Minha Conta' }));
    await userEvent.type(screen.getByLabelText(/Confirme sua senha atual/), 'escapa@2026');
    await userEvent.click(screen.getByRole('button', { name: 'Sim, desativar' }));

    expect(await screen.findByText('/login')).toBeInTheDocument();
    expect(context.logout).toHaveBeenCalledOnce();
  });
});
