import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        // Módulos puros de cálculo: sem DOM, mais rápidos.
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'logica',
          environment: 'node',
          include: ['src/lib/**/*.test.ts', 'src/queries/**/*.test.ts'],
        },
      },
      {
        // Componentes: precisam de DOM de verdade para simular cliques.
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'componentes',
          environment: 'jsdom',
          include: ['src/components/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
          // O projeto vive no OneDrive; carregar o jsdom em processo separado
          // estoura o tempo padrão. Threads compartilham o processo e cabem.
          pool: 'threads',
          testTimeout: 20000,
          hookTimeout: 20000,
        },
      },
    ],
  },
});
