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
        canvas: '#F8F7F4',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#202321',
          muted: '#777C76',
          subtle: '#A2A7A0',
        },
        border: {
          DEFAULT: '#DCDDD7',
          light: '#E8E8E3',
        },
        forest: {
          DEFAULT: '#496B59',
          hover: '#3D5A4A',
          subtle: '#EBF1ED',
        },
        danger: {
          DEFAULT: '#C54A43',
          subtle: '#FAEDEC',
        },
        warning: {
          DEFAULT: '#B58133',
          subtle: '#FBF5EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '5px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
