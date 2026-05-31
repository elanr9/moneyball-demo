/** @type {import('tailwindcss').Config} */

// FieldVision design tokens. The whole product reads its colors from this one
// file so the look can be tuned in a single place. Token names describe their
// ROLE, not a literal hue, so any engineer can reason about them:
//
//   navy  = neutral surfaces. The role number tracks depth: 900 is the deepest
//           app canvas (and recessed/inset fields), 800 is a raised card, 700 is
//           a hover or secondary surface, 600 is a hairline border and 500 is a
//           stronger divider. Higher number == deeper, like a real navy ramp.
//   ink   = text and marks. 100 is the primary near white, 300 is muted, 500 is
//           faint. ink-900 is the one fixed dark value, used for text that sits
//           on a bright accent chip and for modal scrims.
//   blue  = the FieldVision brand accent for actions, links and highlights.
//   team  = the selected club's primary color, injected at runtime as a CSS
//           variable so every club's surfaces feel like their own.
//   fv    = status colors for results, exclusive metrics and ratings.
//
// The palette is a deep broadcast dark theme: charcoal surfaces with a faint
// cool cast, hairline borders, near white text and a single confident blue
// accent, with team color reserved for identity moments. It reads like elite
// pro-sports software rather than a generic admin panel.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#070A0F',
          800: '#10141C',
          700: '#181D27',
          600: '#262D3A',
          500: '#3A4252',
        },
        blue: {
          500: '#3D7DFF',
          400: '#5E97FF',
          300: '#9DBEFF',
        },
        team: {
          DEFAULT: 'var(--team-primary, #3D7DFF)',
          soft: 'var(--team-soft, rgba(61, 125, 255, 0.14))',
        },
        fv: {
          green: '#2BD46F',
          greenLight: 'rgba(43, 212, 111, 0.13)',
          red: '#FF5A63',
          redLight: 'rgba(255, 90, 99, 0.13)',
          yellow: '#FFC53D',
        },
        ink: {
          50: '#CDD3DD',
          100: '#F3F5FA',
          300: '#9AA3B4',
          500: '#5F6878',
          900: '#070A0F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest: '0.18em',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255, 255, 255, 0.03) inset, 0 1px 2px rgba(0, 0, 0, 0.4), 0 12px 28px -16px rgba(0, 0, 0, 0.7)',
        float: '0 24px 60px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        glow: '0 0 0 1px rgba(61, 125, 255, 0.4), 0 8px 28px -8px rgba(61, 125, 255, 0.35)',
      },
      backgroundImage: {
        'team-fade':
          'linear-gradient(180deg, var(--team-soft, rgba(61,125,255,0.14)) 0%, rgba(7,10,15,0) 100%)',
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
      },
    },
  },
  plugins: [],
}
