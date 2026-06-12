import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep space background scale
        void: {
          950: "#04060D",
          900: "#070B16",
          800: "#0B1120",
          700: "#101830",
        },
        // Electric blue — primary accent
        electric: {
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#2E8FFF",
          600: "#1D6FE0",
          700: "#1656B8",
        },
        // Orange — energy / streaks / highlights
        ember: {
          300: "#FFC56F",
          400: "#FFA94D",
          500: "#FF8A2A",
          600: "#F07315",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-blue": "0 0 24px -4px rgba(46, 143, 255, 0.45)",
        "glow-blue-lg": "0 0 60px -10px rgba(46, 143, 255, 0.5)",
        "glow-ember": "0 0 24px -4px rgba(255, 138, 42, 0.45)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px rgba(2,6,23,0.6)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
        "radial-spot":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(46,143,255,0.18), transparent)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 18px -6px rgba(46,143,255,0.5)" },
          "50%": { boxShadow: "0 0 32px -4px rgba(46,143,255,0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "flame-flicker": {
          "0%, 100%": { transform: "scale(1) rotate(-1deg)" },
          "50%": { transform: "scale(1.08) rotate(1.5deg)" },
        },
        "level-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "flame-flicker": "flame-flicker 0.9s ease-in-out infinite",
        "level-pop": "level-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
