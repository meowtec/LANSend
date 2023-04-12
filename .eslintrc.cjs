module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      './packages/web/tsconfig.json',
      './packages/launcher/tsconfig.json',
      './tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './packages/*/tsconfig.json',
      },
      node: false,
    },
  },
  env: {
    browser: true,
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    'no-bitwise': 0,
    'no-void': 0,
    'no-param-reassign': ['warn', { props: true, ignorePropertyModificationsForRegex: ['^draft'] }],
    'no-restricted-syntax': ['error', 'WithStatement'],
    'no-nested-ternary': 0,
    'max-len': [1, 160],
    'class-methods-use-this': 0,
    '@typescript-eslint/quotes': ['error', 'single'],
    '@typescript-eslint/no-unsafe-member-access': 1,
    '@typescript-eslint/no-unsafe-call': 1,
    '@typescript-eslint/no-unsafe-assignment': 1,
    '@typescript-eslint/no-misused-promises': 1,
    'react/react-in-jsx-scope': 0,
    'react/require-default-props': 0,
    'react/jsx-props-no-spreading': 0,
    'react/prop-types': 0,
    'import/prefer-default-export': 0,
    'import/extensions': 0,
    'import/no-extraneous-dependencies': 0,
  },
  root: true,
};
