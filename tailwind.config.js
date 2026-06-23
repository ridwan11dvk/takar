export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#C75C3C',
        bg: '#FAF6F0',
        surface: '#FFFFFF',
        'surface-alt': '#F3ECE3',
        text: '#2A2521',
        'text-secondary': '#7A7066',
        'text-muted': '#9A8F82',
        border: '#EFE7DD',
        success: '#15803D',
        warning: '#B45309',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(70,50,35,.05)',
        raised: '0 2px 10px rgba(70,50,35,.06)',
        primary: '0 6px 14px rgba(199,92,60,.3)',
        sheet: '0 -6px 18px rgba(60,40,25,.06)',
      },
    },
  },
  plugins: [],
};
