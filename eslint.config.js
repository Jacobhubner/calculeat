import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import i18next from 'eslint-plugin-i18next'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      i18next,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off',
      // ── i18n: warn on hardcoded strings in JSX during migration ─────────
      // Switch to 'error' once all namespaces have been migrated.
      'i18next/no-literal-string': [
        'warn',
        {
          mode: 'jsx-only',
          // Components that intentionally render raw strings
          ignoreComponent: ['Trans'],
          // HTML attributes that are not user-visible text
          ignoreAttribute: [
            'key',
            'name',
            'id',
            'className',
            'style',
            'data-testid',
            'href',
            'src',
            'type',
            'role',
            'aria-label',
            'tabIndex',
            'target',
            'rel',
            'accept',
            'pattern',
            'autoComplete',
            'inputMode',
          ],
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  prettier
)
