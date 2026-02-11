import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81',
          dark: '#0A2540',
          light: '#1a6bb5',
        },
        accent: {
          DEFAULT: '#00D4FF',
          dark: '#00b8d9',
          light: '#33ddff',
        },
        line: {
          DEFAULT: '#06C755',
          dark: '#05b54c',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
