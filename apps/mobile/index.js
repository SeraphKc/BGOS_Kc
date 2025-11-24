/**
 * @format
 */

import {AppRegistry} from 'react-native';
import { registerGlobals } from '@livekit/react-native';
import App from './App';
import {name as appName} from './app.json';

// Global error handlers to catch any hidden errors
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.log('🔴🔴🔴 GLOBAL ERROR CAUGHT:', error?.message || error);
  console.log('🔴🔴🔴 FATAL:', isFatal);
  console.log('🔴🔴🔴 STACK:', error?.stack);
  if (originalHandler) {
    originalHandler(error, isFatal);
  }
});

// Catch unhandled promise rejections
if (global.HermesInternal) {
  // For Hermes engine
  const originalPromiseRejectionHandler = global.HermesInternal?.enablePromiseRejectionTracker?.();
}

// Alternative promise rejection tracking
Promise._unhandledRejectionHandler = (error) => {
  console.log('🔴🔴🔴 UNHANDLED PROMISE REJECTION:', error?.message || error);
  console.log('🔴🔴🔴 STACK:', error?.stack);
};

// Initialize LiveKit WebRTC globals - CRITICAL for ElevenLabs SDK
registerGlobals();

AppRegistry.registerComponent(appName, () => App);
