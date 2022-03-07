module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    quotes: ['error', 'single'],
  },
  parserOptions: {
    ecmaVersion: 8,
  },
};
