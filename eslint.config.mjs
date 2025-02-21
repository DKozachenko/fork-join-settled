import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommendedeslint from 'eslint-plugin-prettier/recommended';

const prettierConfig = {
  printWidth: 120,
  tabWidth: 2,
  tabs: false,
  singleQuote: true,
  endOfLine: 'auto'
}

const tsConfig = {
  files: ['**/*.ts'],
  ignores: ["src/*.spec.ts"],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    prettierRecommendedeslint
  ],
  rules: {
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'prettier/prettier': [
      'error',
      {
        ...prettierConfig,
        semi: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always'
      }
    ]
  }
}

export default tseslint.config([
  tsConfig,
]);
