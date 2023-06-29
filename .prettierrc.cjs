module.exports = {
  singleQuote: true,
  semi: false,
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
}
