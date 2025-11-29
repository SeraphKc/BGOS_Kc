import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Hardcoded for testing - move to .env later
const WEB_CLIENT_ID = '409747646574-7dsdbe3nnud8qtev360gm95ltdpf4r4c.apps.googleusercontent.com';

export function configureGoogleSignIn() {
  console.log('🔧 Configuring Google Sign-In...');
  
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });
  
  console.log('✅ Google Sign-In configured');
}

export { GoogleSignin };