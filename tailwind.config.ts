import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: '#6C3CE9',
          light: '#8B5CF6',
          dark: '#4F1FBF',
          darker: '#3B0FA5',
          50: '#F5F0FF',
          100: '#EDE5FF',
          200: '#D4C4FB',
          500: '#8B5CF6',
          600: '#6C3CE9',
          700: '#4F1FBF',
          800: '#3B0FA5',
          900: '#2D0B7A',
        },
        coral: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5C',
        },
        teal: {
          DEFAULT: '#0EA5A5',
          light: '#14D4D4',
        },
        accent: {
          yellow: '#FBBF24',
          green: '#10B981',
          red: '#EF4444',
          blue: '#3B82F6',
        },
        slate: {
          50: '#F8F9FC',
          100: '#F1F3F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          500: '#64748B',
          700: '#334155',
          900: '#0F172A',
        }
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
export default config
