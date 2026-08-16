import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    // Simula um ambiente de navegador real
    environment: 'jsdom',

    // Roda o setup global antes de cada arquivo de teste
    setupFiles: ['./src/test/setup.ts'],

    // Permite usar describe/it/expect sem importar explicitamente
    globals: true,

    // Configurações de cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@routes': fileURLToPath(new URL('./src/routes', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
    },
  },
});
