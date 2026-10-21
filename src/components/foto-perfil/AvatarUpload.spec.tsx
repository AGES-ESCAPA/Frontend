import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AvatarUpload } from './AvatarUpload';

describe('AvatarUpload', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir as iniciais quando não houver foto', () => {
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={vi.fn()}
        imageUrl=""
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );
    expect(screen.getByText('NU')).toBeInTheDocument();
  });

  it('deve gerar pré-visualização e disparar onFileSelected com arquivo válido', async () => {
    const onFileSelected = vi.fn();
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={onFileSelected}
        imageUrl=""
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );

    const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-file-input');

    await userEvent.upload(input, file, { applyAccept: false });

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(onFileSelected).toHaveBeenCalledWith(file);
    expect(screen.getByRole('img', { name: 'Nome do Usuário' })).toHaveAttribute('src', 'mock-url');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('deve exibir erro e não chamar onFileSelected quando tipo for inválido', async () => {
    const onFileSelected = vi.fn();
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={onFileSelected}
        imageUrl=""
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );

    const file = new File(['text content'], 'doc.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('avatar-file-input');

    await userEvent.upload(input, file, { applyAccept: false });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('deve exibir erro e não chamar onFileSelected quando arquivo for maior que o limite', async () => {
    const onFileSelected = vi.fn();
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={onFileSelected}
        imageUrl=""
        maxSizeBytes={1024} // 1KB para teste
      />,
    );

    const bigFile = new File([new ArrayBuffer(2048)], 'foto.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('avatar-file-input');

    await userEvent.upload(input, bigFile);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('deve exibir a foto existente', () => {
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={vi.fn()}
        imageUrl="foto-atual.png"
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );

    expect(screen.getByRole('img', { name: 'Nome do Usuário' })).toHaveAttribute(
      'src',
      'foto-atual.png',
    );
  });

  it('deve manter a foto atual quando o arquivo selecionado for inválido', async () => {
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={vi.fn()}
        imageUrl="foto-atual.png"
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );

    const arquivoInvalido = new File(['conteudo'], 'documento.pdf', {
      type: 'application/pdf',
    });

    await userEvent.upload(screen.getByTestId('avatar-file-input'), arquivoInvalido, {
      applyAccept: false,
    });

    expect(screen.getByRole('img', { name: 'Nome do Usuário' })).toHaveAttribute(
      'src',
      'foto-atual.png',
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
