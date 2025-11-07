/**
 * Environment Configuration
 * Centralized configuration for API endpoints and app settings
 */

export const ENV = {
  // API Configuration
  API_BASE_URL: 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89',

  // Timeouts
  API_TIMEOUT: 30000, // 30 seconds

  // Storage Keys
  STORAGE_KEYS: {
    USER_TOKEN: '@user_token',
    USER_DATA: '@user_data',
    THEME: '@theme',
  },

  // App Configuration
  APP_VERSION: '1.0.0',
  APP_NAME: 'BG OS Assistant',

  // Features Flags
  FEATURES: {
    PUSH_NOTIFICATIONS: false,
    FILE_ATTACHMENTS: false,
    VOICE_MESSAGES: false,
    REAL_TIME_SYNC: false,
  },

  // Message Configuration
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE_MB: 10,

  // UI Configuration
  REFRESH_INTERVAL: 30000, // 30 seconds
  TOAST_DURATION: 3000, // 3 seconds
};

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  return `${ENV.API_BASE_URL}${endpoint}`;
};

// Check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof ENV.FEATURES): boolean => {
  return ENV.FEATURES[feature];
};

export default ENV;
