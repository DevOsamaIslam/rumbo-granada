import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.tsx'],
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
      // ESM `import ... from 'react-native'` is resolved by Vite, which would
      // otherwise parse RN 0.88's Flow-typed entry and fail. CJS `require()` is
      // handled by the Module._load patch in `src/test/rn-patch.cjs`.
      'react-native': '/home/tovia/Projects/granabus/src/test/rn.cjs',
      '@': '/home/tovia/Projects/granabus/src',
      '~': '/home/tovia/Projects/granabus/src',
    },
  },
});