const VIMEO_EMBED_QUERY =
  'badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0';

export const toVimeoEmbedUrl = (src?: string): string | null => {
  if (!src) return null;

  const match = src.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/i);

  return match ? `https://player.vimeo.com/video/${match[1]}?${VIMEO_EMBED_QUERY}` : null;
};
