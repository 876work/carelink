import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lagoon: '#00A8B5',
        coral: '#FF6B6B',
        sand: '#FFF4E6',
        palm: '#2D6A4F'
      }
    }
  },
  plugins: []
} satisfies Config;
