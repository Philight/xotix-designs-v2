module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  jsxSingleQuote: true,
  semi: true,
  printWidth: 80,
  bracketSpacing: true,
  plugins: [
    require('@shopify/prettier-plugin-liquid/standalone'),
    require('prettier-plugin-tailwindcss'),
  ],
  overrides: [
    {
      files: '*.liquid',
      options: {
        parser: 'liquid-html',
        singleQuote: false,
        printWidth: 120,
      },
    },
  ],
};
