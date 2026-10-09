/** @type {import('tailwindcss').Config} */

// The app is reached from esgforsuppliers.com, so it wears the site's palette: warm
// neutrals on cream, ink for actions, one emerald accent. The neutral scale replaces
// slate and gray, and every cool accent the app had collected (indigo, violet, blue,
// sky, purple) folds into the site's emerald, so the 1,000-odd existing class names
// keep working and change colour in one place. Status colours (red, amber, yellow,
// orange, rose) keep their meaning and stay as Tailwind ships them.
const neutral = {
  50: '#FDFBF7',  // site cream
  100: '#F7F5F0', // site ivory
  200: '#E5E3DE', // site border
  300: '#D4D1CA',
  400: '#A3A09A',
  500: '#6B6B6B', // site muted
  600: '#57554F',
  700: '#3F3D39',
  800: '#2A2926',
  900: '#1A1A1A', // site ink
  950: '#0F0F0E',
};
const emerald = {
  50: '#F1F7F4',
  100: '#E7F1ED', // site accentSoft
  200: '#CBE1D7',
  300: '#9EC7B5',
  400: '#5EA287',
  500: '#2B8468',
  600: '#1B775D',
  700: '#146B55', // site accent
  800: '#0F5443',
  900: '#0B3F33',
  950: '#062920',
};

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        slate: neutral,
        gray: neutral,
        indigo: emerald,
        violet: emerald,
        purple: emerald,
        blue: emerald,
        sky: emerald,
        emerald,
        green: emerald,
        teal: emerald,
        brand: {
          cream: '#FDFBF7',
          ivory: '#F7F5F0',
          ink: '#1A1A1A',
          muted: '#6B6B6B',
          line: '#E5E3DE',
          accent: '#146B55',
          accentSoft: '#E7F1ED',
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

