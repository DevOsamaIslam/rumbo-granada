const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const reactPlugin = require('eslint-plugin-react');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: {
        version: '19',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.expo/',
      'coverage/',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'src/test/setup.tsx',
      // CommonJS test shims run under Node, not the app bundler.
      'src/test/*.cjs',
    ],
  },
]);