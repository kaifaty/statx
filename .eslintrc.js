module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'no-unused-labels': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    'linebreak-style': 'off',
    quotes: [
      'warn',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],
    semi: ['error', 'never'],
    'prettier/prettier': [
      'error',
      {
        printWidth: 110,
        endOfLine: 'auto',
      },
    ],
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
}
