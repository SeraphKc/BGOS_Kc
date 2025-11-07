import React from 'react';
import { COLORS, WHITE_4_OPACITIES, SEMANTIC_COLORS } from '../utils/colors';

const ColorExample: React.FC = () => {
  return (
    <div className="p-8 bg-dark-bg min-h-screen">
      <h1 className="text-white-1 text-3xl font-bold mb-8">Color System Examples</h1>
      
      {/* Method 1: Using Tailwind Classes */}
      <section className="mb-8">
        <h2 className="text-primary-1 text-xl font-semibold mb-4">1. Tailwind Classes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white-1 text-dark-bg p-4 rounded-lg">
            <div className="w-8 h-8 bg-white-1 rounded mb-2"></div>
            <p className="text-sm font-medium">White/1</p>
            <p className="text-xs opacity-70">#FFFFFF</p>
          </div>
          
          <div className="bg-primary-1 text-dark-bg p-4 rounded-lg">
            <div className="w-8 h-8 bg-primary-1 rounded mb-2"></div>
            <p className="text-sm font-medium">Primary/1</p>
            <p className="text-xs opacity-70">#FFD900</p>
          </div>
          
          <div className="bg-dark-2 text-white-1 p-4 rounded-lg">
            <div className="w-8 h-8 bg-dark-2 rounded mb-2 border border-white-4-20"></div>
            <p className="text-sm font-medium">Dark/2</p>
            <p className="text-xs opacity-70">#30302E</p>
          </div>
          
          <div className="bg-error text-white-1 p-4 rounded-lg">
            <div className="w-8 h-8 bg-error rounded mb-2"></div>
            <p className="text-sm font-medium">Error</p>
            <p className="text-xs opacity-70">#FF1F1F</p>
          </div>
        </div>
      </section>

      {/* Method 2: Using CSS Variables */}
      <section className="mb-8">
        <h2 className="text-primary-1 text-xl font-semibold mb-4">2. CSS Variables</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: 'var(--color-white-4-10)',
              color: 'var(--color-white-1)',
              border: '1px solid var(--color-white-4-20)'
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: 'var(--color-white-4-10)' }}
            ></div>
            <p className="text-sm font-medium">White/4 10%</p>
            <p className="text-xs opacity-70">rgba(255,255,255,0.1)</p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: 'var(--color-dark-3)',
              color: 'var(--color-white-1)'
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: 'var(--color-dark-3)' }}
            ></div>
            <p className="text-sm font-medium">Dark/3</p>
            <p className="text-xs opacity-70">#3D3838</p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: 'var(--color-primary-1)',
              color: 'var(--color-dark-bg)'
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: 'var(--color-primary-1)' }}
            ></div>
            <p className="text-sm font-medium">Primary/1</p>
            <p className="text-xs opacity-70">#FFD900</p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: 'var(--color-dark-1)',
              color: 'var(--color-white-1)'
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: 'var(--color-dark-1)' }}
            ></div>
            <p className="text-sm font-medium">Dark/1</p>
            <p className="text-xs opacity-70">#212120</p>
          </div>
        </div>
      </section>

      {/* Method 3: Using TypeScript Constants */}
      <section className="mb-8">
        <h2 className="text-primary-1 text-xl font-semibold mb-4">3. TypeScript Constants</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: COLORS.WHITE_1,
              color: COLORS.DARK_BG
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: COLORS.WHITE_1 }}
            ></div>
            <p className="text-sm font-medium">White/1</p>
            <p className="text-xs opacity-70">{COLORS.WHITE_1}</p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: COLORS.PRIMARY_1,
              color: COLORS.DARK_BG
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: COLORS.PRIMARY_1 }}
            ></div>
            <p className="text-sm font-medium">Primary/1</p>
            <p className="text-xs opacity-70">{COLORS.PRIMARY_1}</p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: WHITE_4_OPACITIES[50],
              color: COLORS.WHITE_1
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: WHITE_4_OPACITIES[50] }}
            ></div>
            <p className="text-sm font-medium">White/4 50%</p>
            <p className="text-xs opacity-70">{WHITE_4_OPACITIES[50]}</p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: SEMANTIC_COLORS.background.secondary,
              color: SEMANTIC_COLORS.text.primary
            }}
          >
            <div 
              className="w-8 h-8 rounded mb-2"
              style={{ backgroundColor: SEMANTIC_COLORS.background.secondary }}
            ></div>
            <p className="text-sm font-medium">Semantic Secondary</p>
            <p className="text-xs opacity-70">{SEMANTIC_COLORS.background.secondary}</p>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="mb-8">
        <h2 className="text-primary-1 text-xl font-semibold mb-4">4. Usage Examples</h2>
        
        {/* Button Examples */}
        <div className="space-y-4 mb-6">
          <button className="bg-primary-1 text-dark-bg px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all">
            Primary Button
          </button>
          
          <button className="bg-dark-2 text-white-1 px-6 py-3 rounded-lg font-semibold border border-white-4-20 hover:bg-dark-3 transition-all">
            Secondary Button
          </button>
          
          <button className="bg-error text-white-1 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all">
            Error Button
          </button>
        </div>

        {/* Card Example */}
        <div className="bg-dark-2 border border-white-4-10 rounded-lg p-6">
          <h3 className="text-white-1 text-lg font-semibold mb-2">Card Title</h3>
          <p className="text-white-4-70 mb-4">
            This is an example card using the color system. Notice how the text uses different opacity levels for hierarchy.
          </p>
          <div className="flex gap-2">
            <span className="bg-primary-1 text-dark-bg px-3 py-1 rounded-full text-sm font-medium">
              Tag 1
            </span>
            <span className="bg-dark-3 text-white-1 px-3 py-1 rounded-full text-sm font-medium">
              Tag 2
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ColorExample; 