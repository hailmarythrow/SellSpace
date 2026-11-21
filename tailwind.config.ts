import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#17231f", muted: "#6f7d77", canvas: "#f6f8f5", line: "#e1e8e3", emerald: "#16845d", mint: "#ddf4e9" },
      boxShadow: { soft: "0 12px 40px rgba(28, 64, 48, 0.08)" }
    }
  },
  plugins: []
};
export default config;
