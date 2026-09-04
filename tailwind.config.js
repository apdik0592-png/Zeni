/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        paper: "#FFFFFF",
        blush: "#F7D6D0",
        mint: "#2A7C13",
        slate: "#2E6FA0",
        indigo: "#2F39A9",
        violet: "#3E0F8D"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        xl2: "1.25rem",
        pill: "999px"
      },
      boxShadow: {
        soft: "0 12px 32px -16px rgba(47,57,169,0.35)",
        deep: "0 20px 48px -20px rgba(62,15,141,0.45)"
      },
      keyframes: {
        "pop": {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" }
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        pop: "pop 320ms cubic-bezier(.34,1.56,.64,1)",
        rise: "rise 260ms ease-out"
      }
    }
  },
  plugins: []
};
