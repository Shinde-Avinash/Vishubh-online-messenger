module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface / background tokens
        'surface': '#f1f5f9',
        'surface-dark': '#0b1220',
        // Card / panel tokens
        'card': '#ffffff',
        'card-dark': '#0f1724',
        // Primary / accent tokens
        'primary': '#3b82f6',
        'accent-start': '#ff7a18',
        'accent-end': '#af002d',
        // Muted / text
        'muted': '#64748b',
        'muted-dark': '#94a3b8',
      },
      boxShadow: {
        'soft': '0 6px 20px rgba(2,6,23,0.12)',
      }
    },
  },
  plugins: [],
};
