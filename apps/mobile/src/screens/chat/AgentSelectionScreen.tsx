import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, setSelectedAssistant } from '@bgos/shared-state';
import type { Assistant } from '@bgos/shared-types';

const AgentSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const assistants = useSelector((state: RootState) => state.assistants.list);

  // Separate pinned and unpinned assistants
  const pinnedAssistants = assistants
    .filter((a) => a.isStarred)
    .sort((a, b) => (a.starOrder || 0) - (b.starOrder || 0));
  
  const unpinnedAssistants = assistants.filter((a) => !a.isStarred);

  const handleSelectAssistant = (assistant: Assistant) => {
    dispatch(setSelectedAssistant(assistant.id));
    navigation.navigate('Chat' as never, { chatId: 'new' } as never);
  };

  const renderAssistant = ({ item }: { item: Assistant }) => (
    <TouchableOpacity
      style={styles.assistantCard}
      onPress={() => handleSelectAssistant(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.assistantInfo}>
        <Text style={styles.assistantName}>{item.name}</Text>
        <Text style={styles.assistantSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
      {item.isStarred && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedIcon}>⭐</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Assistant</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={[...pinnedAssistants, ...unpinnedAssistants]}
        renderItem={renderAssistant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          pinnedAssistants.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pinned Assistants</Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#212121',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212121',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  assistantInfo: {
    flex: 1,
  },
  assistantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assistantSubtitle: {
    fontSize: 14,
    color: '#999999',
  },
  pinnedBadge: {
    marginLeft: 8,
  },
  pinnedIcon: {
    fontSize: 20,
  },
  separator: {
    height: 8,
  },
});

export default AgentSelectionScreen;
