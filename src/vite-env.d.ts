/// <reference types="vite/client" />

// Tipagem das variáveis de ambiente expostas pelo Vite.
// Adicione novas variáveis VITE_* aqui conforme necessário.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** UUID do admin enviado em `X-User-Id` nas rotas `/admin/**` (até o login por token existir). */
  readonly VITE_ADMIN_USER_ID?: string;
  readonly VITE_VIMEO_ACCESS_TOKEN: string;
  readonly VITE_YOUTUBE_API_KEY: string;
  readonly VITE_AI_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
