import type { Config } from "tailwindcss";
import { addDynamicIconSelectors } from "@iconify/tailwind";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: '0px',
        md: '0px',
        DEFAULT: '0px',
        lg: '0px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        md: '0px 4px 16px -2px rgba(0, 0, 0, 0.08), 0px 2px 4px -1px rgba(0, 0, 0, 0.08)',
        lg: '0px 12px 32px -4px rgba(0, 0, 0, 0.08), 0px 4px 8px -2px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [addDynamicIconSelectors()],
};
export default config;
