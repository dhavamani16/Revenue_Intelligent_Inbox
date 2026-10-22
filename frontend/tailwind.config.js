/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pageBg: "#151515",
        sidebarBg: "#272830",
        cardBg: "#202124",
        cardBorder: "#3B3B3B",
        tealHero: "#103F49",
        cyanPrimary: "#08B6D4",
        blueSecondary: "#008DB5",
        textMain: "#F5F5F5",
        textMuted: "#999999",
      },
      boxShadow: {
        cyanGlow: "0 4px 20px rgba(8, 182, 212, 0.35)",
        cyanHover: "0 6px 25px rgba(8, 182, 212, 0.5)",
      }
    },
  },
  plugins: [],
}
