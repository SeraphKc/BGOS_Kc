import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, UserActions, AssistantActions, ChatActions } from '@bgos/shared-state';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import RotatingLogo from '../components/RotatingLogo';
import AuthService from '../services/AuthService';

const LoadingScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const isAuth = await AuthService.isAuthenticated();

        if (isAuth) {
          // Get stored user data
          const userData = await AuthService.getUserData();
          const tokens = await AuthService.getTokens();

          if (userData && tokens) {
            // Restore auth state in Redux
            dispatch(
              UserActions.login({
                user: {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  avatarUrl: '',
                },
                token: tokens.accessToken,
              })
            );

            // Load assistants and chats data
            await loadInitialData(userData.id, tokens.accessToken);

            // Navigate to Main (drawer navigator) immediately after data is loaded
            navigation.reset({
              index: 0,
              routes: [{
                name: 'Main' as never,
                state: {
                  routes: [{ name: 'Chat' as never, params: { chatId: 'new' } }],
                }
              }],
            });
          } else {
            // No valid data, go to login
            navigateToLogin();
          }
        } else {
          // Not authenticated, go to login
          navigateToLogin();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigateToLogin();
      }
    };

    const loadInitialData = async (userId: string, token: string) => {
      try {
        setIsLoadingData(true);
        dispatch(AssistantActions.setLoading(true));
        dispatch(ChatActions.setLoading(true));

        const data = await fetchAssistantsWithChats(userId, token);

        dispatch(AssistantActions.setAssistants(data.assistants));
        dispatch(ChatActions.setChats(data.chats));
      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch(AssistantActions.setError('Failed to load assistants'));
        dispatch(ChatActions.setError('Failed to load chats'));
      } finally {
        setIsLoadingData(false);
        dispatch(AssistantActions.setLoading(false));
        dispatch(ChatActions.setLoading(false));
      }
    };

    const navigateToLogin = () => {
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      }, 2000);
    };

    checkAuth();
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      <RotatingLogo size={300} />
      <Text style={styles.text}>BGOS</Text>
      {isLoadingData && (
        <Text style={styles.loadingText}>Loading assistants...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: 2,
    fontFamily: 'Styrene-B',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
    fontFamily: 'Styrene-B',
  },
});

export default LoadingScreen;
