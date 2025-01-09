/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: ['airbnb', 'airbnb/hooks'],
  env: {
    browser: true
  },
  ignorePatterns: [
    '**/dist/**'
  ],
  rules: {
    'comma-dangle': 'off',
    'max-len': ['warn', {
      code: 100,
      ignoreComments: true,
      ignoreStrings: true
    }],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-closing-bracket-location': 'off',
    'react/jsx-first-prop-new-line': 'off',
    'react/jsx-max-props-per-line': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-closing-tag-location': 'off',
    'react/destructuring-assignment': 'off',
    'react/require-default-props': 'off',
    'react/jsx-no-bind': 'off',
    'react/prop-types': 'off',
    'operator-linebreak': 'off',
    'object-curly-newline': 'off',
    'no-restricted-globals': 'off',
    'function-paren-newline': 'off',
    'no-console': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-return-assign': 'off',
    'no-undef': 'off',
    // This rule doesn't work with generic components
    'react/jsx-props-no-multi-spaces': 'off',
    'jsx-a11y/aria-role': ['error', {
      ignoreNonDOM: true
    }],
    'no-plusplus': ['error', {
      allowForLoopAfterthoughts: true
    }],
    // I don't agree with Airbnb's reason for blocking for loops: https://github.com/airbnb/javascript/issues/1271
    'no-restricted-syntax': 'off',
    'no-continue': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-empty': ['error', {
      allowEmptyCatch: true
    }],
    'lines-between-class-members': ['error', {
      enforce: [{
        blankLine: 'always',
        prev: '*',
        next: '*'
      }, {
        blankLine: 'never',
        prev: 'field',
        next: 'field'
      }]
    }]
  },
  plugins: [
    '@typescript-eslint'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname
  }
};
