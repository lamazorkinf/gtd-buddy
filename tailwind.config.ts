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
        // Nueva paleta de colores GTD Buddy
        gtd: {
          // Violeta Suave - Claridad (cabeceras, secciones principales, botones primarios)
          clarity: {
            50: "#F5F1FE",
            100: "#EBE1FD",
            200: "#D7C3FB",
            300: "#C3A5F9",
            400: "#B388EB", // Color principal
            500: "#9B6FE8",
            600: "#8356E5",
            700: "#6B3DE2",
            800: "#5324DF",
            900: "#3B0BDC",
          },
          // Magenta Intenso - Acción (CTAs, "Hacer Ahora", "Agregar tarea")
          action: {
            50: "#FDF2FB",
            100: "#FCE5F7",
            200: "#F9CBEF",
            300: "#F6B1E7",
            400: "#D46AC0", // Color principal
            500: "#E157D3",
            600: "#DE44E6",
            700: "#DB31F9",
            800: "#C828E0",
            900: "#B51FC7",
          },
          // Turquesa Claro - Enfoque (Próximas acciones, filtros activos)
          focus: {
            50: "#F0FDFB",
            100: "#E1FBF7",
            200: "#C3F7EF",
            300: "#A5F3E7",
            400: "#7DE2D1", // Color principal
            500: "#5FDBC9",
            600: "#41D4C1",
            700: "#23CDB9",
            800: "#1FB5A5",
            900: "#1B9D91",
          },
          // Celeste Niebla - Ligereza (fondo general)
          lightness: {
            50: "#E1F1FF", // Color principal
            100: "#CCE7FF",
            200: "#99CFFF",
            300: "#66B7FF",
            400: "#339FFF",
            500: "#0087FF",
            600: "#006FCC",
            700: "#005799",
            800: "#003F66",
            900: "#002733",
          },
          // Verde Menta - Confianza (completadas, logros, revisión)
          confidence: {
            50: "#F2FBF5",
            100: "#E5F7EB",
            200: "#CBEED7",
            300: "#B1E5C3",
            400: "#A2E4B8", // Color principal
            500: "#88DBA4",
            600: "#6ED290",
            700: "#54C97C",
            800: "#4AB070",
            900: "#409764",
          },
          // Gris Lavanda - Neutro Inteligente (tarjetas, listas, elementos secundarios)
          neutral: {
            50: "#DCD6F7", // Color principal
            100: "#D1C9F5",
            200: "#C6BCF3",
            300: "#BBAFF1",
            400: "#B0A2EF",
            500: "#A595ED",
            600: "#9A88EB",
            700: "#8F7BE9",
            800: "#846EE7",
            900: "#7961E5",
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
