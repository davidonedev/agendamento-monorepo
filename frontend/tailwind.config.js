/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        landing: ['Inter', 'system-ui', 'sans-serif'],
        lp: ['"Inter Tight"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        spotlight: { '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' }, '100%': { opacity: '1', transform: 'translate(-50%,-40%) scale(1)' } },
        float:   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: {
        marquee:           'marquee 40s linear infinite',
        'marquee-reverse': 'marquee 45s linear infinite reverse',
        spotlight:         'spotlight 2s ease .75s 1 forwards', // Aceternity UI
        float:             'float 6s ease-in-out infinite',
        'float-delayed':   'float 6s ease-in-out 3s infinite',
      },
      colors: {
        // Paleta da landing (escopo próprio, não afeta o painel)
        landing: {
          bg: '#F6F7F5',          // névoa: fundo
          surface: '#FFFFFF',
          line: '#E1E6E3',
          ink: '#13252B',         // tinta: texto principal
          muted: '#4A5A60',       // texto secundário (AA sobre névoa e branco)
          petrol: '#0F6B66',      // primária / CTAs (AA com branco)
          'petrol-dark': '#0B4F4B',
          lavender: '#B9A7EE',    // acento decorativo, nunca texto
          plum: '#6B4A8F',        // tom do salão (texto AA)
          sage: '#5E8C77',        // tom da estética (decorativo)
          'sage-ink': '#3F6B57',  // tom da estética para texto (AA)
          'sage-light': '#DCE8E3',
        },
        // Landing redesenhada: tokens (canais RGB) em src/styles/landing-tokens.css
        lp: {
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
          'primary-active': 'rgb(var(--color-primary-active) / <alpha-value>)',
          'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
          success: 'rgb(var(--color-success) / <alpha-value>)',
          'success-strong': 'rgb(var(--color-success-strong) / <alpha-value>)',
          'success-ink': 'rgb(var(--color-success-ink) / <alpha-value>)',
          'success-soft': 'rgb(var(--color-success-soft) / <alpha-value>)',
          white: 'rgb(var(--color-bg) / <alpha-value>)',
          black: 'rgb(var(--color-text) / <alpha-value>)',
          alt: 'rgb(var(--color-bg-alt) / <alpha-value>)',
          line: 'rgb(var(--color-border) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          'on-dark-muted': 'rgb(var(--color-on-dark-muted) / <alpha-value>)',
          danger: 'rgb(var(--color-danger) / <alpha-value>)',
          'danger-soft': 'rgb(var(--color-danger-soft) / <alpha-value>)',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      boxShadow: {
        'lp-card': 'var(--shadow-card)',
        // Aceternity UI (bento-grid e outros usam shadow-input)
        input: '0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)',
      },
      borderRadius: {
        'lp-card': 'var(--radius-card)',
        'lp-image': 'var(--radius-image)',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

