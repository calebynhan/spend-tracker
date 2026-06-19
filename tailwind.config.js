/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0a',
          raised: '#1a1a1a',
          card: '#1c1c1e',
          border: '#2c2c2e',
        },
        accent: {
          green: '#30d158',
          red: '#ff453a',
          blue: '#0a84ff',
          purple: '#bf5af2',
        },
      },
    },
  },
  plugins: [],
};
