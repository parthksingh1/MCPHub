import base from './eslint.base.mjs';

export default [
  ...base,
  {
    ignores: ['apps/**', 'packages/**', 'workers/**'],
  },
];
