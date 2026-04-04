/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e0f7f6",
          100: "#b3ece9",
          200: "#80e0db",
          300: "#4dd4ce",
          400: "#26cac3",
          500: "#00B5AD", // primary teal
          600: "#00a09a",
          700: "#008780",
          800: "#006e68",
          900: "#004f4b",
        },
        navy: {
          DEFAULT: "#0A2540",
          light:   "#0d2e4d",
          lighter: "#12375c",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Syne'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10)",
        glow: "0 0 20px rgba(0,181,173,0.25)",
      },
      animation: {
        "fade-up":    "fadeUp 0.4s ease forwards",
        "fade-in":    "fadeIn 0.3s ease forwards",
        "slide-in":   "slideIn 0.3s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: "translateX(-12px)" }, to: { opacity: 1, transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
