module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#E8F5EC',
        mist: '#8FA397',
        fog: '#4E5E54',
        flare: '#FF3B5C',
        radon: {
          6: '#000F06',
          12: '#001F0C',
          25: '#00401A',
          40: '#006629',
          60: '#00993D',
        },
      },
    },
  },
  plugins: [],
};
