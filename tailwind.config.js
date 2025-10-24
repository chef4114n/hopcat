/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'hop': 'hop 0.6s ease-out',
        'bounce-counter': 'bounceCounter 0.3s ease-out',
        'pulse-hps': 'pulseHps 0.5s ease-in-out infinite alternate',
        'confetti-fall': 'confettiFall 3s linear forwards',
        'float-up': 'floatUp 1s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'fade-in-down': 'fadeInDown 1s ease-out',
        'fade-in-up': 'fadeInUp 1s ease-out 0.5s both',
      },
      keyframes: {
        hop: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-80px) rotate(-5deg) scale(1.1)' },
          '50%': { transform: 'translateY(-120px) rotate(0deg) scale(1.15)' },
          '75%': { transform: 'translateY(-80px) rotate(5deg) scale(1.1)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        bounceCounter: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseHps: {
          'from': { transform: 'scale(1)', color: '#ffffff' },
          'to': { transform: 'scale(1.05)', color: '#ffd700' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-100px) scale(1.5)' },
        },
        slideInLeft: {
          'from': { opacity: '0', transform: 'translateX(-30px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(100px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInDown: {
          'from': { opacity: '0', transform: 'translateY(-30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        'gold': '#ffd700',
      }
    },
  },
  plugins: [],
}
