import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8fbf1",
          100: "#c8f4dd",
          200: "#8fe8bd",
          300: "#4fd897",
          400: "#22c07a",
          500: "#0fa063",
          600: "#0a7f4f",
          700: "#0a6440",
          800: "#0b4f34",
          900: "#0a412c",
        },
        ink: {
          DEFAULT: "#0b1220",
          soft: "#4a5568",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        content: "1120px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,18,32,.04), 0 12px 32px rgba(11,18,32,.08)",
      },
    },
  },
  plugins: [],
};

export default config;
