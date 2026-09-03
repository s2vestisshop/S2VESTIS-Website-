/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // ---- Design tokens: a bespoke apparel palette, not default Tailwind ----
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      // Warm off-white page canvas + surfaces
      canvas: '#FAF9F6',
      surface: '#FFFFFF',
      overlay: 'rgba(23, 22, 20, 0.55)',

      // Ink — warm near-black text / structural greys
      ink: {
        50: '#F5F4F1',
        100: '#E7E4DE',
        200: '#CFC9BF',
        300: '#B0A99B',
        400: '#8B8375',
        500: '#6B6357',
        600: '#4F4A40',
        700: '#3A362F',
        800: '#26231E',
        900: '#171614',
        DEFAULT: '#171614',
      },

      // Clay — warm terracotta accent (CTAs, sale badges, focus)
      clay: {
        50: '#FBF1EC',
        100: '#F4DDD0',
        200: '#E7B79E',
        300: '#D9906D',
        400: '#C86F45',
        500: '#B5502E',
        600: '#963F24',
        700: '#73301C',
        800: '#4F2214',
        900: '#2E140C',
        DEFAULT: '#B5502E',
      },

      // Sage — quiet secondary accent (success, "in stock", tags)
      sage: {
        50: '#F0F3EE',
        100: '#DCE4D5',
        200: '#B9C8AC',
        300: '#93A981',
        400: '#6F8A5C',
        500: '#556E45',
        600: '#425737',
        700: '#31402A',
        DEFAULT: '#556E45',
      },

      // Functional
      danger: '#B23A2E',
      success: '#3F7A3B',
      warning: '#C08A2E',
    },

    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      display: ['Fraunces', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
    },

    extend: {
      screens: {
        xs: '480px',
      },
      maxWidth: {
        container: '1440px',
      },
      spacing: {
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
      },
      borderRadius: {
        card: '0.5rem',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,22,20,0.04), 0 8px 24px rgba(23,22,20,0.06)',
        lift: '0 2px 6px rgba(23,22,20,0.06), 0 18px 40px rgba(23,22,20,0.12)',
        drawer: '-8px 0 40px rgba(23,22,20,0.18)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.45s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 26s linear infinite',
      },
    },
  },
  plugins: [],
};
