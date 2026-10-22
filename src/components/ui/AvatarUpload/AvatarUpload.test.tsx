import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AvatarUpload } from './AvatarUpload';

vi.mock('@components/ui/Avatar/Avatar', () => ({
  Avatar: ({ imageUrl, name, size }: { imageUrl?: string; name: string; size?: string }) =>
    imageUrl ? (
      <img src={imageUrl} alt={name} data-size={size} />
    ) : (
      <span data-size={size}>
        {name
          .trim()
          .split(/\s+/)
          .map((parte) => parte[0])
          .join('')
          .slice(0, 1) + name.trim().split(/\s+/)[name.trim().split(/\s+/).length - 1].slice(0, 1)}
      </span>
    ),
}));

describe('AvatarUpload', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve abrir o seletor de arquivos ao clicar em Alterar foto', () => {
    render(<AvatarUpload name="Nome do Usuário" onFileSelected={vi.fn()} imageUrl="" />);

    const input = screen.getByTestId('avatar-file-input');
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.click(screen.getByRole('button', { name: 'Alterar foto' }));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('deve exibir as iniciais quando não houver foto', async () => {
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={vi.fn()}
        imageUrl=""
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );
    expect(await screen.findByText('NU')).toBeInTheDocument();
  });

  it('deve exibir a foto no tamanho grande, maior que o botão', () => {
    render(<AvatarUpload name="Nome do Usuário" onFileSelected={vi.fn()} />);

    expect(screen.getByText('NU')).toHaveAttribute('data-size', 'lg');
  });

  it('deve exibir as iniciais quando a API devolver a foto como null ou não houver imageUrl', () => {
    const { rerender } = render(
      <AvatarUpload name="Nome do Usuário" onFileSelected={vi.fn()} imageUrl={null} />,
    );
    expect(screen.getByText('NU')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(<AvatarUpload name="Nome do Usuário" onFileSelected={vi.fn()} />);
    expect(screen.getByText('NU')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
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
    expect(await screen.findByRole('img', { name: 'Nome do Usuário' })).toHaveAttribute(
      'src',
      'mock-url',
    );
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

    expect(screen.getByRole('alert')).toHaveTextContent('A imagem deve ter no máximo 1 KB.');
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('deve informar o limite em MB com vírgula decimal', async () => {
    render(
      <AvatarUpload name="Nome do Usuário" onFileSelected={vi.fn()} maxSizeBytes={100 * 1024} />,
    );

    const bigFile = new File([new ArrayBuffer(200 * 1024)], 'foto.jpg', { type: 'image/jpeg' });

    await userEvent.upload(screen.getByTestId('avatar-file-input'), bigFile);

    expect(screen.getByRole('alert')).toHaveTextContent('A imagem deve ter no máximo 0,1 MB.');
  });

  it('deve usar o limite de 2 MB da API quando maxSizeBytes não for informado', async () => {
    const onFileSelected = vi.fn();
    render(<AvatarUpload name="Nome do Usuário" onFileSelected={onFileSelected} />);

    const justOverLimit = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'foto.jpg', {
      type: 'image/jpeg',
    });

    await userEvent.upload(screen.getByTestId('avatar-file-input'), justOverLimit);

    expect(screen.getByRole('alert')).toHaveTextContent('A imagem deve ter no máximo 2 MB.');
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('deve exibir a foto existente', async () => {
    render(
      <AvatarUpload
        name="Nome do Usuário"
        onFileSelected={vi.fn()}
        imageUrl="foto-atual.png"
        maxSizeBytes={2 * 1024 * 1024}
      />,
    );

    expect(await screen.findByRole('img', { name: 'Nome do Usuário' })).toHaveAttribute(
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

    expect(await screen.findByRole('img', { name: 'Nome do Usuário' })).toHaveAttribute(
      'src',
      'foto-atual.png',
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
