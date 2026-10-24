import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileServiceError, profileService } from '@services/profileService';
import type { UserProfile } from '@/types/profile';
import { ProfileDataCard } from './ProfileDataCard';

vi.mock('@services/profileService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    profileService: { updateProfile: vi.fn(), uploadAvatar: vi.fn() },
  };
});

const updateProfileMock = vi.mocked(profileService.updateProfile);
const uploadAvatarMock = vi.mocked(profileService.uploadAvatar);

const student: UserProfile = {
  profile: 'STUDENT',
  editable: true,
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  cpf: '39011122233',
  phone: '+55 51 99120-3344',
  companyName: null,
  cnpj: null,
  avatarUrl: null,
};

const employee: UserProfile = {
  ...student,
  profile: 'EMPLOYEE',
  editable: false,
  name: 'Luciana Prado',
  email: 'luciana@vistamar.com.br',
  phone: '54999998888',
  companyName: 'Pousada Vista Mar LTDA',
};

const company: UserProfile = {
  profile: 'COMPANY',
  editable: true,
  name: 'Ana Responsável',
  email: 'contato@vistamar.com.br',
  cpf: null,
  phone: '51999990001',
  companyName: 'Pousada Vista Mar LTDA',
  cnpj: '12345678000191',
  avatarUrl: null,
};

const photo = new File(['img'], 'foto.png', { type: 'image/png' });

const renderCard = (profile: UserProfile) => {
  const onSaved = vi.fn();
  const onNotify = vi.fn();
  render(<ProfileDataCard profile={profile} onSaved={onSaved} onNotify={onNotify} />);
  return { onSaved, onNotify };
};

describe('ProfileDataCard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = vi.fn(() => 'blob:preview');
        static revokeObjectURL = vi.fn();
      },
    );
  });

  afterEach(() => {
    // Desmonta antes de restaurar a URL: o AvatarUpload revoga a pré-visualização no unmount.
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows the student data with masked CPF and phone and locks e-mail and CPF', () => {
    renderCard(student);

    expect(screen.getByLabelText(/Nome Completo/)).toHaveValue('Mariana Costa');
    expect(screen.getByLabelText('E-mail')).toHaveValue('mariana@email.com');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('CPF')).toHaveValue('390.111.222-33');
    expect(screen.getByLabelText('CPF')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Telefone')).toHaveValue('(51) 99120-3344');
    expect(screen.queryByLabelText(/Razão Social/)).not.toBeInTheDocument();
  });

  it('saves name and phone with only digits and notifies the success', async () => {
    const saved = { ...student, name: 'Mariana Souza', phone: '54999998888' };
    updateProfileMock.mockResolvedValue(saved);
    const { onSaved, onNotify } = renderCard(student);

    const name = screen.getByLabelText(/Nome Completo/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Mariana Souza');
    const phone = screen.getByLabelText('Telefone');
    await userEvent.clear(phone);
    await userEvent.type(phone, '54999998888');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(updateProfileMock).toHaveBeenCalledWith({ name: 'Mariana Souza', phone: '54999998888' });
    expect(onNotify).toHaveBeenCalledWith(
      'success',
      'Dados atualizados',
      'Suas alterações foram salvas.',
    );
  });

  it('blocks the submit and shows the field errors when the form is invalid', async () => {
    renderCard(student);

    await userEvent.clear(screen.getByLabelText(/Nome Completo/));
    const phone = screen.getByLabelText('Telefone');
    await userEvent.clear(phone);
    await userEvent.type(phone, '5199');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    expect(await screen.findByText('Preenchimento obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Informe um telefone válido.')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('shows a 400 from the API under the field it refers to', async () => {
    updateProfileMock.mockRejectedValue(new ProfileServiceError(400, 'phone is invalid'));
    const { onNotify } = renderCard(student);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    expect(await screen.findByText('Informe um telefone válido.')).toBeInTheDocument();
    expect(onNotify).not.toHaveBeenCalled();
  });

  it('keeps the typed data and notifies the error when the request fails', async () => {
    updateProfileMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { onSaved, onNotify } = renderCard(student);

    const name = screen.getByLabelText(/Nome Completo/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Nome Digitado');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(onNotify).toHaveBeenCalledWith(
        'error',
        'Não foi possível salvar',
        'Verifique sua conexão e tente novamente.',
      ),
    );
    expect(name).toHaveValue('Nome Digitado');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('sends the selected photo after the data and saves the new avatar URL', async () => {
    updateProfileMock.mockResolvedValue(student);
    uploadAvatarMock.mockResolvedValue('http://minio/avatars/nova.png');
    const { onSaved } = renderCard(student);

    await userEvent.upload(screen.getByTestId('avatar-file-input'), photo);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith({
        ...student,
        avatarUrl: 'http://minio/avatars/nova.png',
      }),
    );
    expect(uploadAvatarMock).toHaveBeenCalledWith(photo);
  });

  it('keeps the saved data and warns when only the photo upload fails', async () => {
    const saved = { ...student, name: 'Mariana Souza' };
    updateProfileMock.mockResolvedValue(saved);
    uploadAvatarMock.mockRejectedValue(new ProfileServiceError(500, 'Falha no storage'));
    const { onSaved, onNotify } = renderCard(student);

    await userEvent.upload(screen.getByTestId('avatar-file-input'), photo);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(onNotify).toHaveBeenCalledWith(
      'error',
      'Não foi possível enviar a foto',
      'Os demais dados foram salvos. Tente enviar a foto novamente.',
    );
    expect(onNotify).not.toHaveBeenCalledWith('success', expect.anything(), expect.anything());
  });

  it('shows the company fields and sends the legal name in the update', async () => {
    updateProfileMock.mockResolvedValue(company);
    renderCard(company);

    expect(screen.getByLabelText(/Nome do Responsável/)).toHaveValue('Ana Responsável');
    expect(screen.getByLabelText('CNPJ')).toHaveValue('12.345.678/0001-91');
    const legalName = screen.getByLabelText(/Razão Social/);
    await userEvent.clear(legalName);
    await userEvent.type(legalName, 'Vista Mar S.A.');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: 'Ana Responsável',
        phone: '51999990001',
        companyName: 'Vista Mar S.A.',
      }),
    );
  });

  it('shows the employee data as read-only text with the employer', () => {
    renderCard(employee);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Luciana Prado')).toBeInTheDocument();
    expect(screen.getByText('390.111.222-33')).toBeInTheDocument();
    expect(screen.getByText('(54) 99999-8888')).toBeInTheDocument();
    expect(screen.getByText('Pousada Vista Mar LTDA')).toBeInTheDocument();
  });

  it('lets the employee save only the photo, enabling the button after choosing one', async () => {
    uploadAvatarMock.mockResolvedValue('http://minio/avatars/luciana.png');
    const { onSaved } = renderCard(employee);

    const saveButton = screen.getByRole('button', { name: 'Salvar Foto' });
    expect(saveButton).toBeDisabled();
    await userEvent.upload(screen.getByTestId('avatar-file-input'), photo);
    await userEvent.click(saveButton);

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith({
        ...employee,
        avatarUrl: 'http://minio/avatars/luciana.png',
      }),
    );
    expect(updateProfileMock).not.toHaveBeenCalled();
  });
});
