import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class", "class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    tabSize: {
      "1": "1",
      "8": "8",
    },
    extend: {
      screens: {
        "2xl": "1536px",
        "3xl": "1700px",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        "secondary-foreground":
          "hsl(var(--secondary-foreground) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        "accent-foreground": "hsl(var(--accent-foreground) / <alpha-value>)",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        "destructive-foreground":
          "hsl(var(--destructive-foreground) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "card-foreground": "hsl(var(--card-foreground) / <alpha-value>)",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        "popover-foreground": "hsl(var(--popover-foreground) / <alpha-value>)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        "input-dark": "hsl(var(--input-dark) / <alpha-value>)",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("tailwind-scrollbar")({ nocompatible: true }),
    require("tailwindcss-animate"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".--orange-500": {
          outline: "2px solid",
          outlineColor: "#f97316",
        },
        ".--orange-600": {
          outline: "2px solid",
          outlineColor: "#ea580c",
        },
        ".--amber-500": {
          outline: "2px solid",
          outlineColor: "#f59e0b",
        },
        ".--amber-600": {
          outline: "2px solid",
          outlineColor: "#d97706",
        },
        ".--lime-500": {
          outline: "2px solid",
          outlineColor: "#84cc16",
        },
        ".--lime-600": {
          outline: "2px solid",
          outlineColor: "#65a30d",
        },
        ".--emerald-500": {
          outline: "2px solid",
          outlineColor: "#10b981",
        },
        ".--emerald-600": {
          outline: "2px solid",
          outlineColor: "#059669",
        },
        ".--sky-500": {
          outline: "2px solid",
          outlineColor: "#0ea5e9",
        },
        ".--sky-600": {
          outline: "2px solid",
          outlineColor: "#0284c7",
        },
        ".--blue-500": {
          outline: "2px solid",
          outlineColor: "#3b82f6",
        },
        ".--blue-600": {
          outline: "2px solid",
          outlineColor: "#2563eb",
        },
        ".--purple-500": {
          outline: "2px solid",
          outlineColor: "#a855f7",
        },
        ".--purple-600": {
          outline: "2px solid",
          outlineColor: "#9333ea",
        },
        ".--pink-500": {
          outline: "2px solid",
          outlineColor: "#ec4899",
        },
        ".--pink-600": {
          outline: "2px solid",
          outlineColor: "#db2777",
        },
      });
    }),
  ],
};
export default config;
