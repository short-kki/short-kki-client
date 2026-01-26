/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary - Warm Orange (따뜻한 오렌지)
        primary: {
          50: "#FFF7F0",
          100: "#FEEAD8",
          200: "#FDD4B0",
          300: "#FCB97D",
          400: "#FB9D4A",
          500: "#FA8112", // Main
          600: "#E07310",
          700: "#B85E0D",
          800: "#8F490A",
          900: "#663408",
          DEFAULT: "#FA8112",
        },
        // Secondary - Warm Yellow/Beige
        secondary: {
          50: "#FFFDF7",
          100: "#FFF9E6",
          200: "#FFF2C7",
          300: "#FFE999",
          400: "#FFDD66",
          500: "#FFD23F", // Main
          600: "#E6B800",
          700: "#B38F00",
          800: "#806600",
          900: "#4D3D00",
          DEFAULT: "#FFD23F",
        },
        // Neutral - Warm Grays
        neutral: {
          0: "#FFFFFF",
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        // Semantic
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
        // Legacy aliases
        cream: "#FAFAF9",
        "dark-gray": "#1C1917",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        DEFAULT: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
      },
      spacing: {
        xxs: "2px",
        xs: "4px",
        sm: "8px",
        md: "12px",
        base: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
        "4xl": "48px",
        "5xl": "64px",
      },
      fontSize: {
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["15px", { lineHeight: "22px" }],
        md: ["17px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["28px", { lineHeight: "36px" }],
        "3xl": ["34px", { lineHeight: "42px" }],
        "4xl": ["40px", { lineHeight: "48px" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(28, 25, 23, 0.04)",
        sm: "0 2px 4px rgba(28, 25, 23, 0.06)",
        md: "0 4px 8px rgba(28, 25, 23, 0.08)",
        lg: "0 8px 16px rgba(28, 25, 23, 0.10)",
        xl: "0 12px 24px rgba(28, 25, 23, 0.12)",
        primary: "0 4px 12px rgba(250, 129, 18, 0.25)",
      },
    },
  },
  plugins: [],
};
