import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useSignUp } from '@clerk/clerk-expo';
import { COLORS } from '@bgos/shared-logic';
import Toast from 'react-native-toast-message';

type VerificationStep = 'form' | 'email_verification';

export default function SignUpScreen({ navigation }: any) {
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Verification state
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp, setActive, isLoaded } = useSignUp();

  // Step 1: Create sign-up request
  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    // Validate all required fields
    if (!firstName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your first name',
      });
      return;
    }

    if (!lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your last name',
      });
      return;
    }

    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your email',
      });
      return;
    }

    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a password',
      });
      return;
    }

    // Client-side password validation
    if (password.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 8 characters',
      });
      return;
    }

    try {
      setLoading(true);

      console.log('📝 Creating sign-up with:', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });

      // Create the sign-up request with required fields
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        password: password,
      });

      console.log('📝 Sign-up created, preparing email verification...');

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Switch to email verification view
      setVerificationStep('email_verification');
      setVerificationCode('');

      Toast.show({
        type: 'success',
        text1: 'Verification Email Sent',
        text2: 'Check your inbox for the verification code',
      });
    } catch (error: any) {
      console.error('📝 Sign-up error:', error);
      const errorMessage = error.errors?.[0]?.message || error.message || 'Sign-up failed';
      Toast.show({
        type: 'error',
        text1: 'Sign-up Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify email code
  const handleEmailVerification = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);

      console.log('📧 Attempting email verification with code:', verificationCode);

      // Attempt to verify the email
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      console.log('📧 Email verification status:', result.status);
      console.log('📧 Session ID:', result.createdSessionId);

      // Check if sign-up is complete
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: 'Welcome to BGOS',
        });
        return;
      }

      if (result.status === 'complete') {
        // Complete but no session - try signUp object
        if (signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          Toast.show({
            type: 'success',
            text1: 'Account Created!',
            text2: 'Welcome to BGOS',
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Account Created!',
            text2: 'Please sign in',
          });
          navigation.navigate('Login');
        }
      } else {
        // Something else is missing
        console.log('📧 Status:', result.status);
        console.log('📧 Missing fields:', signUp.missingFields);

        Toast.show({
          type: 'info',
          text1: 'Additional Steps Required',
          text2: `Status: ${result.status}`,
        });
      }
    } catch (error: any) {
      console.error('📧 Email verification error:', error);
      const errorMessage = error.errors?.[0]?.message || error.message || 'Invalid code';

      if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('verified')) {
        Toast.show({
          type: 'success',
          text1: 'Already Verified!',
          text2: 'Please sign in',
        });
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Toast.show({
        type: 'success',
        text1: 'Code Resent',
        text2: 'Check your inbox for the new code',
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.errors?.[0]?.message || 'Could not resend code',
      });
    }
  };

  // Go back to form
  const handleBack = () => {
    setVerificationStep('form');
    setVerificationCode('');
  };

  // Email Verification View
  if (verificationStep === 'email_verification') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Verify Email
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter the 6-digit code sent to {email}
          </Text>

          <TextInput
            label="Verification Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            disabled={loading}
            maxLength={6}
          />

          <Button
            mode="contained"
            onPress={handleEmailVerification}
            style={styles.button}
            disabled={loading || !verificationCode}
            loading={loading}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <TouchableOpacity onPress={handleResendCode} disabled={loading}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBack} disabled={loading}>
            <Text style={styles.backLink}>← Back to Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Sign Up Form View
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineLarge" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Join BGOS today
        </Text>

        <View style={styles.nameRow}>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            style={[styles.input, styles.halfInput]}
            mode="outlined"
            autoCapitalize="words"
            autoComplete="given-name"
            disabled={loading}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            style={[styles.input, styles.halfInput]}
            mode="outlined"
            autoCapitalize="words"
            autoComplete="family-name"
            disabled={loading}
          />
        </View>

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
          autoComplete="new-password"
          disabled={loading}
        />
        <Text style={styles.passwordHint}>
          Must be at least 8 characters
        </Text>

        <Button
          mode="contained"
          onPress={handleSignUp}
          style={styles.button}
          disabled={loading || !isLoaded || !firstName || !lastName || !email || !password}
          loading={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    marginBottom: 15,
  },
  passwordHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 4,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  loginText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 20,
    marginBottom: 30,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.PRIMARY_1,
    fontWeight: '600',
  },
  backLink: {
    textAlign: 'center',
    color: COLORS.PRIMARY_1,
    marginTop: 20,
    fontSize: 14,
  },
  resendLink: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 15,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
