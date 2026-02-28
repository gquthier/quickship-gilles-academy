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
        // Dark Neo-Brutalism — QuickShip
        bg: '#0A0A0A',
        surface: '#111111',
        'surface-hover': '#1A1A1A',
        'surface-border': '#2A2A2A',
        'surface-light': '#222222',
        accent: '#CCFF00',
        'accent-hover': '#B8E600',
        'accent-muted': 'rgba(204, 255, 0, 0.12)',
        'text-primary': '#EFEFEF',
        'text-secondary': '#888888',
        'text-muted': '#555555',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '2px',
        md: '2px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
        full: '9999px',
      },
      boxShadow: {
        brutal: '6px 6px 0px 0px #CCFF00',
        'brutal-sm': '4px 4px 0px 0px #CCFF00',
        'brutal-xs': '2px 2px 0px 0px #CCFF00',
        'brutal-white': '6px 6px 0px 0px #EFEFEF',
        'brutal-sm-white': '4px 4px 0px 0px #EFEFEF',
        'brutal-dark': '6px 6px 0px 0px #000000',
        card: '0 1px 3px rgba(0,0,0,0.5)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.6)',
        glow: '0 0 20px rgba(204, 255, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
