// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    plugins: [
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'), // Cần cho aspect-square, aspect-[4/3]
  ],}
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Đảm bảo các file React của bạn sẽ được quét
  ],
  theme: {
    extend: {}, // Nơi bạn có thể mở rộng theme mặc định
  },
  plugins: [],
}