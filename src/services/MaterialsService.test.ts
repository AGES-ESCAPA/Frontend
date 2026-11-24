import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadMaterial } from './MaterialsService';

describe('downloadMaterial', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('devolve uma object URL quando o download responde ok', async () => {
    const blob = new Blob(['conteudo'], { type: 'application/pdf' });
    const createObjectURL = vi.fn(() => 'blob:material');
    vi.stubGlobal('URL', { ...URL, createObjectURL });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(blob),
      }),
    );

    await expect(downloadMaterial('https://cdn.escapa.com/guia.pdf')).resolves.toBe(
      'blob:material',
    );
    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('lança com o status HTTP quando o arquivo não pode ser baixado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    await expect(downloadMaterial('https://cdn.escapa.com/inexistente.pdf')).rejects.toThrow(
      'Falha ao baixar o arquivo (404)',
    );
  });
});
