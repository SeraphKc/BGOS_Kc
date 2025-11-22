// Color Palette Constants - Updated for cross-platform consistency
export const COLORS = {
    // Main color palette
    MAIN_BG: 'rgb(38, 38, 36)', // Main background
    SIDEBAR_BG: 'rgb(31, 30, 28)', // Sidebar background
    CARD_BG: '#2A2A2A', // Cards/panels - softer gray containers
    INPUT_BG: 'rgb(48, 48, 46)', // Input field
    BORDER: '#3A3A3A', // Borders - subtle gray borders
    // White variants
    WHITE_1: '#FFFFFF',
    WHITE_4: '#FFFFFF',
    // Primary colors
    PRIMARY_1: '#FFD900',
    // Dark variants - updated for consistency
    DARK_1: 'rgb(38, 38, 36)', // Main background
    DARK_2: '#2A2A2A', // Cards/panels
    DARK_3: 'rgb(48, 48, 46)', // Input fields
    DARK_BG: 'rgb(38, 38, 36)', // Main background
    // Error color
    ERROR: '#FF1F1F',
};
// Opacity variants for White/4
export const WHITE_4_OPACITIES = {
    10: 'rgba(255, 255, 255, 0.1)',
    20: 'rgba(255, 255, 255, 0.2)',
    30: 'rgba(255, 255, 255, 0.3)',
    40: 'rgba(255, 255, 255, 0.4)',
    50: 'rgba(255, 255, 255, 0.5)',
    60: 'rgba(255, 255, 255, 0.6)',
    70: 'rgba(255, 255, 255, 0.7)',
    80: 'rgba(255, 255, 255, 0.8)',
    90: 'rgba(255, 255, 255, 0.9)',
};
// Semantic color mapping
export const SEMANTIC_COLORS = {
    // Background colors
    background: {
        primary: COLORS.DARK_BG,
        secondary: COLORS.DARK_2,
        tertiary: COLORS.DARK_3,
        card: COLORS.DARK_1,
    },
    // Text colors
    text: {
        primary: COLORS.WHITE_1,
        secondary: WHITE_4_OPACITIES['70'],
        muted: WHITE_4_OPACITIES['50'],
        disabled: WHITE_4_OPACITIES['30'],
    },
    // Interactive colors
    interactive: {
        primary: COLORS.PRIMARY_1,
        error: COLORS.ERROR,
        success: '#4CAF50', // You can add more semantic colors as needed
        warning: '#FF9800',
    },
    // Border colors
    border: {
        primary: WHITE_4_OPACITIES['10'],
        secondary: WHITE_4_OPACITIES['20'],
        focus: COLORS.PRIMARY_1,
        error: COLORS.ERROR,
    },
};
// Utility function to get color with opacity
export const getColorWithOpacity = (color, opacity) => {
    // Handle rgb() format
    if (color.startsWith('rgb(')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
        }
    }
    // Handle hex format
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
// Utility function to get semantic color
export const getSemanticColor = (path) => {
    const keys = path.split('.');
    let current = SEMANTIC_COLORS;
    for (const key of keys) {
        if (current[key] === undefined) {
            console.warn(`Color path "${path}" not found`);
            return COLORS.WHITE_1; // fallback
        }
        current = current[key];
    }
    return current;
};
