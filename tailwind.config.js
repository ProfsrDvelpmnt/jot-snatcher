/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Original color palette from the project
        terracotta: '#ba745f',
        'light-peach': '#d8b2a7',
        'muted-purple': '#6a1d58',
        'rose-gold': '#C99383',
        'secondary-hover': '#c4a89e',
        'button-bg': '#a86b5a',
        'button-text': '#ffffff',
        
        // Light theme colors
        'light-bg': '#faf8f5',
        'light-card-bg': '#ffffff',
        'light-text': '#1a0716',
        'light-text-secondary': '#421237',
        'light-border': '#e5e0dd',
        
        // Dark theme colors
        'dark-bg': '#1a0716',
        'dark-card-bg': '#421237',
        'dark-text': '#faf8f5',
        'dark-text-secondary': '#f5f1ed',
        'dark-border': '#6a1d58',
      },
      width: {
        'popup': '500px',
      },
      height: {
        'popup': '600px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        'light': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'dark': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'fab': '0 4px 20px rgba(186, 116, 95, 0.3)',
        'fab-hover': '0 6px 25px rgba(186, 116, 95, 0.4)',
      },
      backdropBlur: {
        'fab': '10px',
        'fab-hover': '15px',
      },
      animation: {
        'fab-scale': 'fabScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fab-rotate': 'fabRotate 0.3s ease',
      },
      keyframes: {
        fabScale: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        },
        fabRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(180deg)' },
        },
      },
    },
  },
  plugins: [],
}
