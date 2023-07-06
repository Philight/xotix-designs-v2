import { BREAKPOINTS } from './frontend/utils/BREAKPOINTS';

/* Converts HEX color to RGB */
function toRGB(hex) {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return [r, g, b].join(' ');
}

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,vue,svelte}', './**/*.{liquid,json}'],
  theme: {
    extend: {
      colors: {
        contrast: 'rgba(var(--color-contrast) / <alpha-value>)',
        notice: 'rgba(var(--color-accent) / <alpha-value>)',
        shopPay: 'var(--color-shop-pay)',
        white: '#FFFFFF',
        'white-primary': 'var(--color-white-primary)',
        'white-primary-dark': 'var(--color-white-primary-dark)',
        black: '#000000',
        'black-primary': '#000000',
        'black-transparent': `rgba(${toRGB('var(--color-black)')} / 0.5)`,
        primary: 'rgba(var(--color-primary) / 1)',
        'primary-transparent': `rgba(${toRGB('var(--color-primary)')} / 0.5)`,
        tertiary: 'var(--color-tertiary)',
        'tertiary-dark': 'var(--color-tertiary-dark)',
        'tertiary-transparent': `rgba(${toRGB('var(--color-tertiary)')} / 0.5)`,
        'gray-light': 'var(--color-gray-light)',
        'gray-lighter': 'var(--color-gray-lighter)',
        'button-outline': 'var(--color-gray-lighter)',
      },
      screens: {
        sm: '32em',
        md: '48em',
        lg: '64em',
        xl: '80em',
        '2xl': '96em',
        'sm-max': { max: '48em' },
        'sm-only': { min: '32em', max: '48em' },
        'md-only': { min: '48em', max: '64em' },
        'lg-only': { min: '64em', max: '80em' },
        'xl-only': { min: '80em', max: '96em' },
        '2xl-only': { min: '96em' },
        'mob-lg': { min: BREAKPOINTS['MOBILE_LG'].em + 'em' }, //  480px
        'tab-sm': { min: BREAKPOINTS['TABLET_SM'].em + 'em' }, //  600px
        'tab-md': { min: BREAKPOINTS['TABLET_MD'].em + 'em' }, //  768px
        'tab-lg': { min: BREAKPOINTS['TABLET_LG'].em + 'em' }, //  900px
        'desk-sm': { min: BREAKPOINTS['DESKTOP_SM'].em + 'em' }, //  1024px
        'desk-md': { min: BREAKPOINTS['DESKTOP_MD'].em + 'em' }, //  1200px
        'desk-lg': { min: BREAKPOINTS['DESKTOP_LG'].em + 'em' }, //  1440px
        'desk-xl': { min: BREAKPOINTS['DESKTOP_XL'].em + 'em' }, //  1920px
      },
      spacing: {
        nav: 'var(--height-nav)',
        screen: 'var(--screen-height, 100vh)',
        'page-outer': 'var(--space-outer)',
        full: '100%',
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
        144: '36rem',
        160: '40rem',
      },
      height: {
        screen: 'var(--screen-height, 100vh)',
        'screen-no-nav':
          'calc(var(--screen-height, 100vh) - var(--height-nav))',
        'screen-1/2': '50vh',
        'screen-1/3': 'calc(100vh / 3)',
        'screen-2/3': 'calc(100vh / 3 * 2)',
        'screen-1/4': '25vh',
        'screen-3/4': '75vh',
        'screen-1/5': '20vh',
        'screen-2/5': '40vh',
        'screen-3/5': '60vh',
      },
      width: {
        mobileGallery: 'calc(100vw - 3rem)',
      },
      fontFamily: {
        heading: 'var(--font-family-heading)',
        body: 'var(--font-family-body)',
        btn: 'var(--font-family-btn)',
      },
      fontSize: {
        display: ['var(--font-size-display)', '1.1'],
        heading: ['var(--font-size-heading)', '1.25'],
        lead: ['var(--font-size-lead)', '1.333'],
        copy: ['var(--font-size-copy)', '1.5'],
        fine: ['var(--font-size-fine)', '1.333'],
        'base-plus': ['1.0625rem', '1.625rem'],
        '2xs': ['0.6875rem', '0.875rem'], // 11px
        '3xs': ['0.625rem', '0.75rem'], // 10px
        '5xl-minus': ['2.75rem', '1'],
      },
      fontWeight: {
        'body-weight': 'var(--font-body-weight)',
        'body-weight-bold': 'var(--font-body-weight-bold)',
        'heading-weight': 'var(--font-heading-weight)',
      },
      letterSpacing: {
        1: '0.1em',
        2: '0.2em',
        3: '0.3em',
        4: '0.4em',
        5: '0.5em',
      },
      maxWidth: {
        'prose-narrow': '45ch',
        'prose-wide': '80ch',
        'screen-2xl': '1440px',
        'screen-3xl': '1536px',
        custom: 'var(--max-width)',
      },
      boxShadow: {
        border: 'inset 0px 0px 0px 1px rgb(var(--color-primary) / 0.08)',
        darkHeader: 'inset 0px -1px 0px 0px rgba(21, 21, 21, 0.4)',
        lightHeader: 'inset 0px -1px 0px 0px rgba(21, 21, 21, 0.05)',
      },
      blur: {
        xs: '2px',
      },
    },
  },
};
