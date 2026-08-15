import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: "#7A0019",
        gold: "#C9A227",
      },
    },
  },
  plugins: [],
};

export default config;
