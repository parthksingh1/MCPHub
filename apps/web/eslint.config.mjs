import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

import base from '../../eslint.base.mjs';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  ...base,
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Server Components legitimately read env and log during build.
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
