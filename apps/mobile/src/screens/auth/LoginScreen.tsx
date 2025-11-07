import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = () => {
    // Mock login - replace with actual authentication
    const mockUser = {
      id: '1',
      name: 'User',
      email,
      preferences: {
        theme: 'dark' as const,
        language: 'en',
        notifications: true,
      },
    };

    dispatch(login({ user: mockUser, token: 'mock-token' }));
    navigation.replace('ChatList');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        BG OS Assistant
      </Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.MAIN_BG,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
    color: COLORS.WHITE_1,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});
