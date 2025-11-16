/**
 * @format
 */

import {AppRegistry} from 'react-native';
import { registerGlobals } from '@livekit/react-native';
import App from './App';
import {name as appName} from './app.json';

// Initialize LiveKit WebRTC globals - CRITICAL for ElevenLabs SDK
registerGlobals();

AppRegistry.registerComponent(appName, () => App);
