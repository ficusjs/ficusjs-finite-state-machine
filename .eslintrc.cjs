module.exports = {
  ignorePatterns: ['vitest.config.ts'],
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      extends: 'standard-with-typescript',
      parserOptions: {
        project: './tsconfig.eslint.json'
      }
    }
  ]
}
