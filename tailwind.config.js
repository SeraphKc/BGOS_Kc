/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Main color palette - cross-platform consistent
        main: '#212121', // Main background
        sidebar: 'rgb(31, 30, 28)', // Sidebar background
        card: '#2A2A2A', // Cards/panels
        input: 'rgb(48, 48, 46)', // Input fields
        border: '#3A3A3A', // Borders
        
        // Your color palette
        white: {
          1: '#FFFFFF', // White/1
          4: '#FFFFFF', // White/4 (10% opacity will be handled via opacity classes)
        },
        primary: {
          1: '#FFD900', // Primary/1
          DEFAULT: '#FFD900',
          dark: '#FFB800',
        },
        dark: {
          1: '#212121', // Dark/1 - Main background
          2: '#2A2A2A', // Dark/2 - Cards/panels
          3: 'rgb(48, 48, 46)', // Dark/3 - Input fields
          bg: '#212121', // Dark/Bg - Main background
        },
        error: '#FF1F1F', // #FF1F1F
        // Legacy colors for backward compatibility
        background: {
          DEFAULT: '#212121',
          light: '#2A2A2A',
          card: 'rgba(42,42,42,0.95)',
        },
        text: {
          DEFAULT: '#FFFFFF',
          secondary: 'rgba(255,255,255,0.7)',
        }
      },
      fontFamily: {
        'montserrat': ['Styrene-B', 'Montserrat', 'Arial', 'sans-serif'],
        'styrene': ['Styrene-B', 'Montserrat', 'Arial', 'sans-serif'],
      },
      animation: {
        'wave-pulse': 'wavePulse 0.7s infinite alternate cubic-bezier(.4,2,.6,1)',
        'spin': 'spin 1s linear infinite',
        'countdown': 'countdown 3s linear forwards',
        'pulse': 'pulse 1s infinite',
      },
      keyframes: {
        wavePulse: {
          '0%': { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(1.35)' },
        },
        countdown: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '24px',
      },
      boxShadow: {
        'custom': '0 2px 16px rgba(0,0,0,0.10)',
        '2xl': '0 4px 32px rgba(0,0,0,0.25)',
      },
      transitionDuration: {
        '350': '0.35s',
        '400': '0.4s',
      },
      transitionTimingFunction: {
        'custom': 'cubic-bezier(.4,2,.6,1)',
      },
      spacing: {
        '75': '300px',
        '15': '60px',
        '88': '350px',
        '4.5': '18px',
        '1.5': '6px',
        '2.5': '10px',
        '3.5': '14px',
      },
      maxWidth: {
        '85': '340px',
        '60': '240px',
        '50': '200px',
      }
    },
  },
  plugins: [],
} 