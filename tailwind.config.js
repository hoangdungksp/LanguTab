/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        // Be Vietnam Pro — designed by Bê Foundry specifically for Vietnamese,
        // covers all marked vowels (ư ơ ầ ằ ễ ỗ ữ ỡ ạ ậ ẹ ọ ụ etc.) with proper
        // tone diacritic positioning. Replaces Fredoka which had broken/missing
        // glyphs for several Vietnamese tone marks.
        display: ['"Be Vietnam Pro"', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        zh: ['"Noto Sans SC"', '"Noto Serif SC"', 'system-ui', 'sans-serif'],
        // Sprint 4.8.1: Sour Gummy — variable display font with "gummy
        // bear" wobbly vibe, replaces Freckle Face. Latin-only; do NOT use
        // for Vietnamese diacritics (no glyph coverage for tone marks).
        // Use for all-caps English titles like STARTERS, MOVERS, FLYERS.
        // 700-900 weights look best for big hero text; lighter for subtitles.
        heading: ['"Sour Gummy"', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand palette — coral/mint, distinctive from Duolingo green
        coral: {
          50: '#FFF1EC',
          100: '#FFE0D4',
          200: '#FFBFA8',
          300: '#FF9B7A',
          400: '#FF7E52',
          500: '#FF6B35', // primary
          600: '#E54E1B',
          700: '#B83C12',
        },
        mint: {
          50: '#E9FBF7',
          100: '#CCF5EC',
          200: '#99EBD9',
          300: '#66E0C5',
          400: '#33D5B1',
          500: '#2EC4B6', // secondary
          600: '#22988E',
          700: '#196C66',
        },
        sun: {
          50: '#FFFBEA',
          100: '#FFF3C4',
          200: '#FFE48A',
          300: '#FFD23F', // accent for streaks
          400: '#E6B923',
          500: '#BF9200',
        },
        // Forest green — used for "Easy" rating button to communicate
        // "easier than Good (mint)". Distinct hue so the four rating tints
        // (coral / sun / mint / forest) are immediately distinguishable.
        forest: {
          50: '#E8F7E9',
          100: '#C8EBCB',
          200: '#92D798',
          300: '#5BC265',
          400: '#36A841',
          500: '#1F8A2A', // primary
          600: '#166B20',
          700: '#0E4915',
        },
        ink: {
          50: '#F6F6F9',
          100: '#E9E9EF',
          200: '#CACADA',
          300: '#9999B2',
          400: '#666690',
          500: '#3D3D5C',
          600: '#24243D',
          700: '#1A1A2E', // primary text
          800: '#0F0F1F',
        },
        cream: '#FFF8E7',
        paper: '#FFFDF7',
      },
      boxShadow: {
        chunky: '0 4px 0 0 rgba(0,0,0,0.12)',
        'chunky-coral': '0 4px 0 0 #B83C12',
        'chunky-mint': '0 4px 0 0 #196C66',
        'chunky-forest': '0 4px 0 0 #0E4915',
        'chunky-ink': '0 4px 0 0 #1A1A2E',
        'chunky-sun': '0 4px 0 0 #BF9200',
        'chunky-soft': '0 3px 0 0 rgba(26,26,46,0.12)',
        card: '0 2px 0 0 rgba(26,26,46,0.08), 0 8px 24px -8px rgba(26,26,46,0.08)',
        pop: '0 0 0 4px rgba(255,107,53,0.18)',
      },
      borderRadius: {
        chunk: '20px',
        pill: '999px',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'pop': 'pop 0.3s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'flip': 'flip 0.6s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'shimmer': 'shimmer 2s linear infinite',
        // Sprint 4.8.1: Planet animations
        // - float-slow: gentle Y-axis bob for idle planets (3s loop)
        // - float-medium: faster bob for the centered/focused planet (2.5s loop)
        // - rotate-slow: continuous rotation for atmospheric vibe (40s loop)
        'float-slow': 'floatSlow 3s ease-in-out infinite',
        'float-medium': 'floatMedium 2.5s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 40s linear infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        flip: {
          '0%': { transform: 'rotateY(0)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateY(-400px) rotate(720deg)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        // Sprint 4.8.1: Planet idle animations
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        floatMedium: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
};
