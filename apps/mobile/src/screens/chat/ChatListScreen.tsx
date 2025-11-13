import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { List, FAB, Text, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, ChatActions } from '@bgos/shared-state';
import { COLORS, getRelativeTime } from '@bgos/shared-logic';
import { useLoadInitialData } from '../../hooks/useLoadInitialData';
import { fetchAssistantsWithChats } from '@bgos/shared-services';

export default function ChatListScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const chats = useSelector((state: RootState) => state.chats.list);
  const assistants = useSelector((state: RootState) => state.assistants.list);
  const loading = useSelector((state: RootState) => state.chats.loading);
  const user = useSelector((state: RootState) => state.user.currentUser);
  const token = useSelector((state: RootState) => state.user.token);

  // Load initial data
  useLoadInitialData();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    if (!user || !token) return;

    setRefreshing(true);
    try {
      const data = await fetchAssistantsWithChats(user.id, token);
      dispatch(ChatActions.setChats(data.chats));
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, token, dispatch]);

  const getAssistantName = (assistantId: string) => {
    return assistants.find((a) => a.id === assistantId)?.name || 'Unknown Assistant';
  };

  const getAssistantAvatar = (assistantId: string) => {
    const assistant = assistants.find((a) => a.id === assistantId);
    return assistant?.avatarUrl ? { uri: assistant.avatarUrl } : undefined;
  };

  if (loading && chats.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator animating={true} size="large" color={COLORS.PRIMARY_1} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No chats yet. Start a new conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.title}
              description={getAssistantName(item.assistantId)}
              left={(props) => (
                <List.Icon {...props} icon="message" color={COLORS.PRIMARY_1} />
              )}
              right={(props) =>
                item.unread > 0 ? (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badge}>{item.unread}</Text>
                  </View>
                ) : null
              }
              onPress={() => navigation.navigate('Chat', { chatId: item.id })}
              style={styles.listItem}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.PRIMARY_1}
            />
          }
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AgentSelection')}
        color={COLORS.DARK_1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.MAIN_BG,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.WHITE_1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.WHITE_1,
    textAlign: 'center',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.MAIN_BG,
  },
  badgeContainer: {
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: COLORS.PRIMARY_1,
    color: COLORS.DARK_1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY_1,
  },
});
