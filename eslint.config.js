import globals from 'globals';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended, // JavaScript recommended config
  {
    ignores: ['dist'], // Ignore build output
  },
  {
    files: ['**/*.{ts,tsx}'], // Apply TypeScript rules
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json', // Path to your tsconfig.json
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint, // TypeScript plugin
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'no-await-in-loop': 'error',
      'array-callback-return': 'error',
      'no-duplicate-imports': 'error',
      'no-constant-binary-expression': 'error',
      'no-constructor-return': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-vars': 'off',
      'no-unused-private-class-members': 'error',
      'no-use-before-define': 'error',
      'require-atomic-updates': 'error',
      'no-console': ['warn', { allow: ['warn', 'debug', 'info'] }],

      'arrow-body-style': ['error', 'as-needed'],
      'accessor-pairs': 'error',
      'block-scoped-var': 'error',
      curly: ['error', 'multi', 'consistent'],
      'default-case': 'error',
      'default-case-last': 'error',
      'default-param-last': 'error',
      'dot-notation': ['error', { allowPattern: '^[a-zA-Z_]+$' }],
      eqeqeq: ['error', 'smart'],
      'func-name-matching': 'error',
      camelcase: [
        'error',
        {
          properties: 'always',
          ignoreDestructuring: true,
          ignoreImports: true,
          ignoreGlobals: true,
        },
      ],
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],
      quotes: ['error', 'single'],
      'import/no-unresolved': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  },
];
