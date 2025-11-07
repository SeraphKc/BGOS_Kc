import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, FAB, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';

export default function ChatListScreen({ navigation }: any) {
  const chats = useSelector((state: RootState) => state.chats.list);
  const assistants = useSelector((state: RootState) => state.assistants.list);

  const getAssistantName = (assistantId: string) => {
    return assistants.find((a) => a.id === assistantId)?.name || 'Unknown';
  };

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
              left={(props) => <List.Icon {...props} icon="message" />}
              right={(props) =>
                item.unread > 0 ? (
                  <Text style={styles.badge}>{item.unread}</Text>
                ) : null
              }
              onPress={() =>
                navigation.navigate('Chat', { chatId: item.id })
              }
              style={styles.listItem}
            />
          )}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Chat', { chatId: 'new' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.WHITE_1,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  badge: {
    backgroundColor: COLORS.PRIMARY_1,
    color: COLORS.DARK_1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY_1,
  },
});
