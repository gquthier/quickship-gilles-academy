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
        bg: '#050505',
        surface: '#121212',
        'surface-hover': '#1a1a1a',
        'surface-border': '#262626',
        'surface-light': '#2a2a2a',
        accent: '#CCFF00',
        'accent-hover': '#b3e600',
        'accent-muted': 'rgba(204, 255, 0, 0.15)',
        'text-primary': '#E5E5E5',
        'text-secondary': '#999999',
        'text-muted': '#666666',
      },
      fontFamily: {
        display: ['Clash Display', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(204, 255, 0, 0.1)',
        'glow-lg': '0 0 60px rgba(204, 255, 0, 0.15)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
export default config
