import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      obsidian: path.resolve(__dirname, 'src/__mocks__/obsidian.ts'),
    },
  },
  define: {
    __DEV_MODE__: false,
  },
});
