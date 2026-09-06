// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-config-prettier';

/**
 * Shared flat ESLint config for every workspace package.
 * Packages extend this and layer framework-specific rules on top.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin, unicorn },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // --- TypeScript: `any` is banned by project policy ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // --- Imports ---
      'import/no-unresolved': 'off', // TypeScript already does this, and better.
      'import/order': [
        'error',
        {
          // `type` is deliberately not its own group: `import type` should sit
          // with the module it comes from, not exiled to the bottom of the file.
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@mcphub/**', group: 'internal', position: 'before' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // --- Unicorn: useful subset, minus the dogmatic ones ---
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': [
        'error',
        { cases: { kebabCase: true, camelCase: true, pascalCase: true } },
      ],

      // --- General hygiene ---
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  prettier,
);
