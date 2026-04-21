import js from '@eslint/js';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/test-results/**']
  },
  js.configs.recommended,
  {
    files: ['backend/**/*.js', 'frontend/**/*.js', 'frontend/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        AbortController: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': 'off'
    }
  },
  {
    files: ['backend/tests/**/*.js', 'frontend/tests/**/*.js', 'frontend/tests/**/*.jsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        beforeAll: 'readonly',
        afterEach: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
        vi: 'readonly'
      }
    }
  }
];
