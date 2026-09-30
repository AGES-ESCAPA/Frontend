import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseMaterials } from './CourseMaterials';
import { featuredCourse } from '@/data/courses';

describe('CourseMaterials', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /*Testa/prova se com a inserção do isDownloadable, algo quebrou*/

  it('renders included materials without download actions when isDownloadable is omitted', () => {
    render(<CourseMaterials materials={featuredCourse.materials} />);

    expect(screen.getByRole('heading', { name: 'Materiais Inclusos' })).toBeInTheDocument();
    expect(screen.getByText('Guia de Prompts para Turismo (PDF)')).toBeInTheDocument();
    expect(screen.getByText('Planilha de Automação de Processos (Excel)')).toBeInTheDocument();
    expect(screen.getByText('Mapa de Ferramentas de IA 2025 (PDF)')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  /*Testa percorre os itens do mock e valida se o texto aparece na tela e  se o botão existe*/

  it('renders all complementary materials and a download action for each when isDownloadable is true', () => {
    render(<CourseMaterials materials={featuredCourse.materials} isDownloadable />);

    featuredCourse.materials.forEach((material) => {
      const label = `${material.title} (${material.format})`;
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Baixar ${label}` })).toBeInTheDocument();
    });
  });

  /*Testa se o usuário pode baixar um arquivo disponível*/

  it('lets the user download an available file', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['conteudo']);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    });

    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    const [material] = featuredCourse.materials;
    render(<CourseMaterials materials={featuredCourse.materials} isDownloadable />);

    await user.click(
      screen.getByRole('button', { name: `Baixar ${material.title} (${material.format})` }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(material.fileUrl));
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  /* Testa caso de erro como ok: false */

  it('shows an error toast when the file fails to download', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const [material] = featuredCourse.materials;
    render(<CourseMaterials materials={featuredCourse.materials} isDownloadable />);

    await user.click(
      screen.getByRole('button', { name: `Baixar ${material.title} (${material.format})` }),
    );

    expect(await screen.findByText('Não foi possível baixar o arquivo')).toBeInTheDocument();
  });
});
