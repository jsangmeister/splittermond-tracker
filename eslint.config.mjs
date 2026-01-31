import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig({
  files: ['projects/**/*.ts'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    eslint,
    tseslint,
    'unused-imports': unusedImports,
  },
  extends: [
    'eslint/recommended',
    'tseslint/strictTypeChecked',
    'tseslint/stylisticTypeChecked',
  ],
  rules: {
    'no-prototype-builtins': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/no-misused-promises': [
      'error',
      { checksVoidReturn: { inheritedMethods: false } },
    ],
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-unnecessary-condition': [
      'error',
      { allowConstantLoopConditions: true },
    ],
    '@typescript-eslint/restrict-plus-operands': [
      'error',
      {
        allowAny: true,
      },
    ],
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowNumber: true,
      },
    ],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
});
