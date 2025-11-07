import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { UserActions } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
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
      const response = await authService.login({ email, password });

      dispatch(UserActions.login({
        user: response.user,
        token: response.token,
      }));

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `Logged in as ${response.user.name}`,
      });

      navigation.replace('ChatList');
    } catch (error) {
      console.error('Login failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Invalid credentials or server error',
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
          BG OS Assistant
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign in to access your AI assistants
        </Text>

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
          onSubmitEditing={handleLogin}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          disabled={loading}
          loading={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

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
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  loader: {
    marginTop: 20,
  },
});
