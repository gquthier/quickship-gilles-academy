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
          50: '#F5F0FF',
          100: '#EDE5FF',
          200: '#D4C4FB',
          300: '#B69EF7',
          400: '#9B7CF3',
          500: '#8B5CF6',
          600: '#6C3CE9',
          700: '#4F1FBF',
          800: '#3B0FA5',
          900: '#2D0B7A',
          950: '#1A0640',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-purple': '0 8px 40px rgba(108, 60, 233, 0.15)',
        'glow-purple-lg': '0 20px 60px rgba(108, 60, 233, 0.20)',
        'glow-yellow': '0 8px 30px rgba(251, 191, 36, 0.25)',
        'soft': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card': '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 8px 40px rgba(108, 60, 233, 0.08)',
      }
    },
  },
  plugins: [],
}
export default config
