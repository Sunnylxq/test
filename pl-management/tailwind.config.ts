import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f1117',
          2: '#1a1d2e',
          3: '#242840',
        },
        card: '#1e2235',
        border: '#2e3250',
        accent: {
          DEFAULT: '#6366f1',
          2: '#8b5cf6',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        muted: '#64748b',
        subtle: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'Hiragino Sans', 'Yu Gothic', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
