export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Oswald', 'sans-serif'], // Font mặc định cho body
        'archivo-black': ['"Archivo Black"', 'sans-serif'],
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'oswald': ['Oswald', 'sans-serif'], // Có thể gọi class font-oswald
        'roboto-mono': ['"Roboto Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}