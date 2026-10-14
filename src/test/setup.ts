// Arquivo de setup global para o Vitest.
// Importa os matchers do jest-dom (toBeInTheDocument, toHaveClass, etc.)
// para que fiquem disponíveis em todos os arquivos de teste sem imports extras.
import '@testing-library/jest-dom';

// A partir do Node 25 o `localStorage` nativo do Node fica ativo por padrão e, sem a flag
// --localstorage-file, vira um objeto vazio que sobrescreve o do jsdom (getItem/clear
// deixam de existir). Aqui restauramos o Storage do jsdom para os testes funcionarem em
// qualquer versão do Node.
const { jsdom } = globalThis as typeof globalThis & {
  jsdom?: { window: Pick<Window, 'localStorage' | 'sessionStorage'> };
};

if (jsdom) {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    if (typeof globalThis[key]?.getItem !== 'function') {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: jsdom.window[key],
      });
    }
  }
}
