const VIMEO_OEMBED_URL = 'https://vimeo.com/api/oembed.json';

const GENERIC_ERROR_MESSAGE = 'Não foi possível obter os dados do vídeo no Vimeo.';

interface VimeoOEmbedResponse {
  duration?: number;
}

/**
 * Duração do vídeo em segundos, lida do oEmbed público do Vimeo (sem token).
 * Vídeos não listados só respondem com o hash na URL; privados ou com embed
 * restrito a domínios podem ser recusados.
 */
export const getVimeoVideoDuration = async (
  videoUrl: string,
  signal?: AbortSignal,
): Promise<number> => {
  const response = await fetch(`${VIMEO_OEMBED_URL}?${new URLSearchParams({ url: videoUrl })}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(GENERIC_ERROR_MESSAGE);
  }

  const data: VimeoOEmbedResponse = await response.json();

  if (typeof data.duration !== 'number' || data.duration <= 0) {
    throw new Error(GENERIC_ERROR_MESSAGE);
  }

  return data.duration;
};
