import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useSignIn, useClerk } from '@clerk/clerk-expo';
import { UserActions, AssistantActions, ChatActions } from '@bgos/shared-state';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import { COLORS } from '@bgos/shared-logic';
import AuthService from '../../services/AuthService';
import Toast from 'react-native-toast-message';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Dev fallback - only enable in development mode for testing
const DEV_FALLBACK_ENABLED = __DEV__ && false; // Set to true to enable dev login

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Clerk hooks
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const clerk = useClerk();

  // Handle email/password sign-in with Clerk
  const handleEmailSignIn = async () => {
    if (!signIn || !signInLoaded) return;

    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter email and password',
      });
      return;
    }

    try {
      setLoading(true);

      console.log('🔐 Attempting sign-in with email:', email);

      // Attempt to sign in
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      console.log('🔐 Sign-in result status:', result.status);
      console.log('🔐 Sign-in session ID:', result.createdSessionId);

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });

        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'Successfully signed in',
        });

        // Navigation will happen automatically via AppNavigator's auth state
      } else {
        // Handle additional steps if needed (e.g., 2FA)
        console.log('Sign-in requires additional steps:', result);
        Toast.show({
          type: 'error',
          text1: 'Sign-in Incomplete',
          text2: 'Additional verification required',
        });
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);

      // Handle specific Clerk errors
      const errorMessage = error.errors?.[0]?.message || error.message || 'Invalid credentials';
      Toast.show({
        type: 'error',
        text1: 'Sign-in Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In using Native Google Sign-In SDK + Clerk
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔐 Starting Native Google Sign-In...');

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign out first to ensure fresh account picker
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore sign out errors
      }

      // Trigger native Google Sign-In (shows account picker!)
      const userInfo = await GoogleSignin.signIn();

      // v16+ returns { type: 'success' | 'cancelled', data: ... }
      console.log('🔐 Google Sign-In response type:', userInfo.type);

      // Handle cancellation (v16+ returns type: 'cancelled' instead of throwing)
      if (userInfo.type === 'cancelled') {
        console.log('🔐 User cancelled Google Sign-In');
        setLoading(false);
        return;
      }

      // Debug: Log the full response structure
      console.log('🔐 Google Sign-In FULL RESPONSE:', JSON.stringify(userInfo, null, 2));
      if (userInfo.data) {
        console.log('🔐 userInfo.data keys:', Object.keys(userInfo.data));
        console.log('🔐 userInfo.data.idToken:', userInfo.data.idToken ? 'EXISTS' : 'NULL/UNDEFINED');
      }

      // Get the ID token from the response
      // v16+ structure: userInfo.data?.idToken
      const idToken = userInfo.data?.idToken;
      console.log('🔐 Final ID Token:', idToken ? `${idToken.substring(0, 50)}...` : 'NULL');

      if (!idToken) {
        // Show more details about the issue
        Alert.alert(
          'Debug Info',
          `No ID token received.\n\nResponse: ${JSON.stringify(userInfo, null, 2).substring(0, 500)}`,
          [{ text: 'OK' }]
        );
        throw new Error(`No ID token received from Google.`);
      }

      console.log('🔐 Authenticating with Clerk using Google ID token...');

      // Use Clerk's authenticateWithGoogleOneTap to create/sign in user
      const signInOrUp = await clerk.authenticateWithGoogleOneTap({ token: idToken });
      console.log('🔐 Clerk authentication result:', signInOrUp.status);

      // Handle the callback to set the session active
      await clerk.handleGoogleOneTapCallback(signInOrUp, {
        signInFallbackRedirectUrl: '/',
        signUpFallbackRedirectUrl: '/',
      });

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Successfully signed in with Google',
      });

      // Navigation will happen automatically via AppNavigator's auth state

    } catch (error: any) {
      console.error('🔐 Google Sign-in error:', error);

      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('🔐 User cancelled Google Sign-In');
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Toast.show({
          type: 'info',
          text1: 'Sign in in progress',
          text2: 'Please wait...',
        });
        return;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.show({
          type: 'error',
          text1: 'Google Play Services',
          text2: 'Google Play Services not available or outdated',
        });
        return;
      }

      // Handle Clerk errors
      const errorMessage = error.errors?.[0]?.message || error.message || 'Please try again';
      Toast.show({
        type: 'error',
        text1: 'Google Sign-in Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [clerk]);

  // DEV FALLBACK: Legacy hardcoded login for development testing
  const handleDevLogin = async () => {
    if (!DEV_FALLBACK_ENABLED) return;

    try {
      setLoading(true);

      const userData = {
        id: '1',
        email: 'kc@gmail.com',
        name: 'Kc',
      };

      const accessToken = 'dev-token-123';
      const refreshToken = 'dev-refresh-456';

      // Store credentials securely
      await AuthService.login(accessToken, refreshToken, userData);

      // Update Redux state
      dispatch(UserActions.login({
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatarUrl: '',
        },
        token: accessToken,
      }));

      // Load assistants and chats data
      try {
        dispatch(AssistantActions.setLoading(true));
        dispatch(ChatActions.setLoading(true));
        const data = await fetchAssistantsWithChats(userData.id, accessToken);
        dispatch(AssistantActions.setAssistants(data.assistants));
        dispatch(ChatActions.setChats(data.chats));
      } catch (dataError) {
        console.error('Failed to load initial data:', dataError);
      } finally {
        dispatch(AssistantActions.setLoading(false));
        dispatch(ChatActions.setLoading(false));
      }

      Toast.show({
        type: 'success',
        text1: '[DEV] Welcome!',
        text2: `Dev login as ${userData.name}`,
      });

      // Navigate to Main
      navigation.reset({
        index: 0,
        routes: [{
          name: 'Main',
          state: {
            routes: [{ name: 'Chat', params: { chatId: 'new' } }],
          }
        }],
      });
    } catch (error) {
      console.error('Dev login failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Dev Login Failed',
        text2: 'Check console for details',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Welcome to BGOS
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          The home of your AI assistants
        </Text>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.googleButtonContent}>
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email/Password Sign-In */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry
          autoComplete="password"
          disabled={loading}
          onSubmitEditing={handleEmailSignIn}
        />

        <Button
          mode="contained"
          onPress={handleEmailSignIn}
          style={styles.button}
          disabled={loading || !signInLoaded}
          loading={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Sign Up Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          disabled={loading}
        >
          <Text style={styles.signUpText}>
            Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        {/* Dev Fallback Button - only visible in development */}
        {DEV_FALLBACK_ENABLED && (
          <Button
            mode="outlined"
            onPress={handleDevLogin}
            style={styles.devButton}
            disabled={loading}
            labelStyle={styles.devButtonLabel}
          >
            [DEV] Skip Auth (User 1)
          </Button>
        )}

        {loading && (
          <ActivityIndicator
            animating={true}
            color={COLORS.PRIMARY_1}
            style={styles.loader}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.WHITE_1,
    fontFamily: 'Styrene-B',
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Styrene-B',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  signUpText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 20,
    fontSize: 14,
  },
  signUpLink: {
    color: COLORS.PRIMARY_1,
    fontWeight: '600',
  },
  devButton: {
    marginTop: 30,
    borderColor: '#FF6B6B',
  },
  devButtonLabel: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  loader: {
    marginTop: 20,
  },
});
