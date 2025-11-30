import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { UserActions, AssistantActions, ChatActions } from '@bgos/shared-state';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import RotatingLogo from '../components/RotatingLogo';

// Backend sync endpoint - syncs Clerk user to database and returns DB user ID
const SYNC_USER_ENDPOINT = 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/auth/sync-user';

const LoadingScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Clerk hooks
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const syncAndLoadData = async () => {
      if (!userLoaded || !user) {
        return;
      }

      try {
        setStatusText('Syncing user...');

        // Get Clerk session token
        const clerkToken = await getToken();

        // Sync Clerk user to backend database
        // This will either create a new user or link to existing user by email
        let dbUserId: string;
        try {
          const syncResponse = await fetch(SYNC_USER_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(clerkToken && { 'Authorization': `Bearer ${clerkToken}` }),
            },
            body: JSON.stringify({
              clerkUserId: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              name: user.fullName || user.firstName || 'User',
              avatarUrl: user.imageUrl || '',
            }),
          });

          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            dbUserId = syncData.userId || syncData.id || '1';
          } else {
            // If sync endpoint doesn't exist yet, use fallback
            console.warn('User sync endpoint not available, using fallback user ID');
            dbUserId = '1'; // Fallback to user 1 until webhook is set up
          }
        } catch (syncError) {
          console.warn('User sync failed, using fallback:', syncError);
          dbUserId = '1'; // Fallback to user 1 until webhook is set up
        }

        // Update Redux state with Clerk user data
        dispatch(
          UserActions.login({
            user: {
              id: dbUserId,
              email: user.primaryEmailAddress?.emailAddress || '',
              name: user.fullName || user.firstName || 'User',
              avatarUrl: user.imageUrl || '',
            },
            token: clerkToken || '',
          })
        );

        // Load assistants and chats data
        setStatusText('Loading assistants...');
        await loadInitialData(dbUserId, clerkToken || '');

        // Navigate to Main (drawer navigator)
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Main' as never,
            state: {
              routes: [{ name: 'Chat' as never, params: { chatId: 'new' } }],
            }
          }],
        });
      } catch (error) {
        console.error('Error syncing user:', error);
        setStatusText('Error loading data');
        // Still navigate to main, data might load later
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'Main' as never,
              state: {
                routes: [{ name: 'Chat' as never, params: { chatId: 'new' } }],
              }
            }],
          });
        }, 2000);
      }
    };

    syncAndLoadData();
  }, [userLoaded, user, dispatch, navigation, getToken]);

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

  return (
    <View style={styles.container}>
      <RotatingLogo size={300} />
      <Text style={styles.text}>BGOS</Text>
      {(isLoadingData || statusText) && (
        <Text style={styles.loadingText}>
          {statusText || 'Loading assistants...'}
        </Text>
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
