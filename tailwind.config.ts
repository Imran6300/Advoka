import type { Config } from "tailwindcss";

// Advoka MVP UI/UX Design System — §3 Color system, §4 Typography, §16 Component design
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",

        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          foreground: "var(--text-primary)",
        },
        "ai-accent": "var(--ai-accent)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",

        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",

        // shadcn/ui structural aliases mapped onto the dark palette (never defaults)
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        secondary: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "var(--text-primary)",
        },
      },
      // §16 Component design — restrained corner radii (8 / 12 / 16px)
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "16px",
      },
      // §19 Animation system — timing table
      transitionDuration: {
        hover: "180ms",
        button: "150ms",
        card: "200ms",
        modal: "225ms",
        page: "300ms",
      },
      transitionTimingFunction: {
        advoka: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "ai-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "toast-in": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
        "ai-glow": "ai-glow 3s ease-in-out infinite",
        "toast-in": "toast-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        shimmer: "shimmer 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
