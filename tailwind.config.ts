/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clientum: {
          blue: "#1677FF",     // Azul corporativo Clientum
          blueDark: "#0E53B5", // Azul oscuro para hover/sombras
        }
      },
      boxShadow: {
        clientum: "0 10px 25px -10px rgba(22, 119, 255, .35)",
      }
    },
  },
  plugins: [],
}
