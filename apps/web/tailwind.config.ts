import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FDFCF9',
          100: '#F8F6F0',
          200: '#F4EFEA',
          300: '#ECE5DB',
          400: '#DDD3C3',
          500: '#C7B9A3',
        },
        obsidian: {
          800: '#1A2333',
          850: '#141C2B',
          900: '#0F1622',
          950: '#090E17',
        },
        gilt: {
          50: '#FDFBF2',
          100: '#F8F2D9',
          200: '#EEDDA9',
          300: '#E0C574',
          400: '#D3B049',
          500: '#C59B27',
          600: '#A47D1C',
          700: '#805E15',
          800: '#5C4210',
        },
        sage: {
          50: '#F3F7F4',
          100: '#E4EDE7',
          200: '#C7D9CD',
          600: '#3D7058',
          700: '#2F5744',
          800: '#234133',
        },
        hairline: '#E7E2D8',
      },
      fontFamily: {
        serif: ['var(--font-spectral)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-albert)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'dossier': '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        'drawer': '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
