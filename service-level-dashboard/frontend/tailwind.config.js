/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0046ff",
          blueDark: "#0038cc",
          blueLight: "#e5ecff",
          orange: "#F66608",
          orangeDark: "#d9560a",
          orangeLight: "#fde9d8",
          navy: "#002864",
          navyDark: "#001233",
          navyLight: "#3d5a94",
          black: "#000000",
          gray: "#F2F1F0",
          grayDark: "#c9c8c6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(30, 58, 138, 0.08), 0 1px 2px -1px rgba(30, 58, 138, 0.08)",
      },
    },
  },
  plugins: [],
};
