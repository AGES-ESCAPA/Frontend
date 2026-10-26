import type { CertificateTheme } from '@services/certificateService';

/**
 * Tema efetivo da tela, sempre `light` ou `dark` (a API do PDF recusa outros
 * valores). Os tokens de `:root` em `index.css` são os do tema escuro, então
 * só um `data-theme="light"` explícito no `<html>` muda o resultado.
 */
export const getActiveTheme = (): CertificateTheme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
