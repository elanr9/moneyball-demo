/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1A2E',
          800: '#102540',
          700: '#163558',
          600: '#1F4570',
          500: '#2A567F',
        },
        blue: {
          500: '#4A99E0',
          400: '#6BB0EC',
          300: '#9BC9F2',
        },
        fv: {
          green: '#2E7D32',
          greenLight: '#1F4D2C',
          red: '#C62828',
          yellow: '#F2C94C',
        },
        ink: {
          50: '#F0F5FB',
          100: '#E1E8F0',
          300: '#94A3B8',
          500: '#64748B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest: '0.18em',
      },
    },
  },
  plugins: [],
}
