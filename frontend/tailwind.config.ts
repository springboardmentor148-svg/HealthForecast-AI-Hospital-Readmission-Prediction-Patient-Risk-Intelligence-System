import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        cloud: "#f5f8fc",
        teal: "#0d9488",
      },
    },
  },
  plugins: [],
} satisfies Config;
