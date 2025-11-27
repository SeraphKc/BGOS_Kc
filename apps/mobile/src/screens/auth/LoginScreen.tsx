import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { UserActions, AssistantActions, ChatActions } from '@bgos/shared-state';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import { COLORS } from '@bgos/shared-logic';
import AuthService from '../../services/AuthService';
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
      
      // TODO: Replace with actual API call
      // For now, using hardcoded credentials like desktop
      if (email === 'kc@gmail.com' && password === '123') {
        const userData = {
          id: '1',
          email: 'kc@gmail.com',
          name: 'Kc',
        };
        
        const accessToken = 'user-token-123';
        const refreshToken = 'refresh-token-456';

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
          // Continue anyway - data will load on next screen
        } finally {
          dispatch(AssistantActions.setLoading(false));
          dispatch(ChatActions.setLoading(false));
        }

        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: `Logged in as ${userData.name}`,
        });

        // Navigate to Main drawer with Chat screen
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Main',
            state: {
              routes: [{ name: 'Chat', params: { chatId: 'new' } }],
            }
          }],
        });
      } else {
        throw new Error('Invalid credentials');
      }
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
          Welcome to BGOS
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          The home of your AI assistants
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
    fontFamily: 'Styrene-B',
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Styrene-B',
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
