/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          primary: "#0A1628",
          secondary: "#1A2942",
          card: "#121F38",
          elevated: "#0F1E35",
        },
        border: {
          DEFAULT: "#2A4063",
          light: "#3B5279",
          accent: "#00D4FF",
        },
        accent: {
          DEFAULT: "#00D4FF",
          glow: "rgba(0, 212, 255, 0.15)",
          dark: "#0099B3",
        },
        success: "#00C853",
        warning: "#FF7A00",
        danger: "#FF3B3B",
        info: "#FFD600",
        text: {
          primary: "#EAF2FF",
          secondary: "#8FA4C7",
          muted: "#5A7298",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        number: ["JetBrains Mono", "monospace"],
        body: ["Noto Sans SC", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.25)",
        "glow-sm": "0 0 8px rgba(0, 212, 255, 0.3)",
        "danger-glow": "0 0 12px rgba(255, 59, 59, 0.35)",
        card: "0 4px 20px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan 8s linear infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
