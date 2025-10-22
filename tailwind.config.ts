import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // GTD Buddy Design Tokens
        gtd: {
          // Semantic Colors
          clarity: {
            DEFAULT: "hsl(var(--gtd-clarity))",
            light: "hsl(var(--gtd-clarity-light))",
            dark: "hsl(var(--gtd-clarity-dark))",
            hover: "hsl(var(--gtd-clarity-hover))",
            active: "hsl(var(--gtd-clarity-active))",
          },
          action: {
            DEFAULT: "hsl(var(--gtd-action))",
            light: "hsl(var(--gtd-action-light))",
            dark: "hsl(var(--gtd-action-dark))",
            hover: "hsl(var(--gtd-action-hover))",
            active: "hsl(var(--gtd-action-active))",
          },
          focus: {
            DEFAULT: "hsl(var(--gtd-focus))",
            light: "hsl(var(--gtd-focus-light))",
            dark: "hsl(var(--gtd-focus-dark))",
            hover: "hsl(var(--gtd-focus-hover))",
            active: "hsl(var(--gtd-focus-active))",
          },
          confidence: {
            DEFAULT: "hsl(var(--gtd-confidence))",
            light: "hsl(var(--gtd-confidence-light))",
            dark: "hsl(var(--gtd-confidence-dark))",
            hover: "hsl(var(--gtd-confidence-hover))",
            active: "hsl(var(--gtd-confidence-active))",
          },
          neutral: {
            DEFAULT: "hsl(var(--gtd-neutral))",
            dark: "hsl(var(--gtd-neutral-dark))",
          },
          // GTD Category Colors
          inbox: {
            DEFAULT: "hsl(var(--gtd-inbox))",
            light: "hsl(var(--gtd-inbox-light))",
            bg: "hsl(var(--gtd-inbox-bg))",
          },
          next: {
            DEFAULT: "hsl(var(--gtd-next))",
            light: "hsl(var(--gtd-next-light))",
            bg: "hsl(var(--gtd-next-bg))",
          },
          project: {
            DEFAULT: "hsl(var(--gtd-project))",
            light: "hsl(var(--gtd-project-light))",
            bg: "hsl(var(--gtd-project-bg))",
          },
          waiting: {
            DEFAULT: "hsl(var(--gtd-waiting))",
            light: "hsl(var(--gtd-waiting-light))",
            bg: "hsl(var(--gtd-waiting-bg))",
          },
          someday: {
            DEFAULT: "hsl(var(--gtd-someday))",
            light: "hsl(var(--gtd-someday-light))",
            bg: "hsl(var(--gtd-someday-bg))",
          },
          completed: "hsl(var(--gtd-completed))",
          overdue: "hsl(var(--gtd-overdue))",
          // Interactive States
          disabled: {
            DEFAULT: "hsl(var(--gtd-disabled))",
            text: "hsl(var(--gtd-disabled-text))",
            bg: "hsl(var(--gtd-disabled-bg))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
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
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        aurora: "aurora 60s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
