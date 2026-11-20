/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mystery: {
          darkest: "#000000",
          bg: "#000000",
          card: "rgba(10, 10, 10, 0.75)",
          cardHover: "rgba(18, 18, 18, 0.85)",
          border: "rgba(255, 255, 255, 0.12)",
          borderGlow: "rgba(255, 255, 255, 0.3)",
          accent: "#FFFFFF",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      keyframes: {
        'rise-up': {
          '0%': { transform: 'translateY(80px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      },
      animation: {
        'rise-up': 'rise-up 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-live': 'gentle-float 6s ease-in-out infinite 1.1s',
      },
    },
  },
  plugins: [],
};
