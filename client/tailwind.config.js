/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0B2545',
          700: '#13315C',
          500: '#1B4B91',
          300: '#7EA6D9',
          200: '#C9DAF2',
          100: '#E7EEF9',
        },
        emergency: {
          700: '#A31621',
          500: '#E63946',
          100: '#FDECEE',
        },
        success: {
          700: '#146356',
          500: '#2A9D8F',
          100: '#E3F5F2',
        },
        warning: {
          700: '#B0710A',
          500: '#F4A261',
          100: '#FDF1E4',
        },
        ink: '#1B263B',
        slate: {
          600: '#4A5568',
          400: '#8B95A5',
          200: '#E2E7EF',
          100: '#F1F4F9',
        },
        surface: '#FFFFFF',
        bg: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '36px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        16: '64px',
      },
      maxWidth: {
        content: '1280px',
      },
      borderRadius: {
        card: '8px',
        button: '8px',
        input: '8px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 12px rgba(0, 0, 0, 0.15)',
        soft: '0 10px 30px rgba(11, 37, 69, 0.08)',
      },
    },
  },
  plugins: [],
};
