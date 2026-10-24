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
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float:   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: {
        marquee:           'marquee 40s linear infinite',
        'marquee-reverse': 'marquee 45s linear infinite reverse',
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

