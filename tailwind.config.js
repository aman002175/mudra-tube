/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
      },
      boxShadow: {
        'glass-sm': '0 4px 12px rgba(2, 132, 199, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        'glass': '0 8px 32px 0 rgba(2, 132, 199, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
        'glass-elevated': '0 16px 40px -8px rgba(2, 132, 199, 0.18), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
        'tactile-btn': '0 4px 14px -1px rgba(14, 165, 233, 0.45), 0 2px 4px -1px rgba(14, 165, 233, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        'tactile-pressed': '0 1px 4px rgba(14, 165, 233, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'squircle': '24px',
        'squircle-lg': '32px',
      },
      animation: {
        'liquid-float': 'liquidFloat 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        liquidFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
