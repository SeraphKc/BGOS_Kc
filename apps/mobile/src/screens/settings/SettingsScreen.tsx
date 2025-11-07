import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logout, RootState } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';

export default function SettingsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>
      <List.Item
        title="Profile"
        description={user?.email || ''}
        left={(props) => <List.Icon {...props} icon="account" />}
        onPress={() => {}}
      />
      <List.Item
        title="Theme"
        description="Dark"
        left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
        onPress={() => {}}
      />
      <List.Item
        title="Logout"
        left={(props) => <List.Icon {...props} icon="logout" />}
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  title: {
    padding: 20,
    color: COLORS.WHITE_1,
  },
});
