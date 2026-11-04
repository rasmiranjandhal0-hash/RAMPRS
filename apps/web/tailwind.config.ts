import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ramprs: {
          dark: '#0a0a0a',
          charcoal: '#171717',
          stone: '#737373',
          cream: '#fafaf9',
          accent: '#e11d48',
          gold: '#d97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.2em',
      },
    },
  },
  plugins: [],
};

export default config;

