/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17191c",
        paper: "#ffffff",
        mist: "#f2f2f3",
        fog: "#fafafb",
        slate: "#777b86",
        ash: "#979799",
        smoke: "#a3a6af",
        peach: "#fbe1d1",
        sienna: "#5d2a1a",
        crimson: "#dc2626",
        amber: "#d97706",
        emerald: "#059669",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "ui-serif", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: {
        'card': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(23, 25, 28, 0.05), 0 2px 6px -1px rgba(23, 25, 28, 0.03)',
        'elevated': '0 12px 32px -4px rgba(23, 25, 28, 0.08), 0 4px 12px -2px rgba(23, 25, 28, 0.04)',
      }
    },
  },
  plugins: [],
}
