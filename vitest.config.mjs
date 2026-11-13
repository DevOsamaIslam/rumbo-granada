import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.d.ts',
        'app/',
        'metro.config.js',
        'eslint.config.js',
        'prettier.config.js',
        'vitest.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/home/tovia/Projects/granabus/src',
      '~': '/home/tovia/Projects/granabus/src',
    },
  },
});