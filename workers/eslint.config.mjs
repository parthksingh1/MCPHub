import base from '../eslint.base.mjs';

export default [
  ...base,
  {
    rules: {
      // Workers run in CI: their console output *is* the observability layer.
      'no-console': 'off',
    },
  },
];
