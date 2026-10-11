/**
 * Configuração lida em runtime, injetada pelo `docker-entrypoint.d` do nginx
 * a partir de variáveis de ambiente do container (ver `nginx/50-inject-runtime-env.sh`
 * e `public/env-config.js.template`). Isso permite trocar a URL da API sem
 * rebuildar a imagem — o valor vem do Vault via ExternalSecret, no mesmo
 * padrão usado pelo backend.
 *
 * Em `npm run dev` / testes, `/env-config.js` não existe e `window.__ENV__`
 * fica `undefined`; nesse caso cai para `import.meta.env` (build-time), como
 * já funcionava antes.
 */
declare global {
  interface Window {
    __ENV__?: Partial<Record<'VITE_API_BASE_URL', string>>;
  }
}

const isPlaceholder = (value: string | undefined): boolean =>
  value === undefined || value.startsWith('${') || value === '';

export const getApiBaseUrl = (): string => {
  const runtimeValue =
    typeof window !== 'undefined' ? window.__ENV__?.VITE_API_BASE_URL : undefined;
  if (!isPlaceholder(runtimeValue)) {
    return runtimeValue as string;
  }
  return import.meta.env.VITE_API_BASE_URL;
};
