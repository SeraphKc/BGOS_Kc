import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, Text, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { UserActions, RootState } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function SettingsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              dispatch(UserActions.logout());

              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out',
              });

              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to logout',
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>

      <List.Section>
        <List.Subheader style={styles.subheader}>Account</List.Subheader>
        <List.Item
          title="Profile"
          description={user?.email || 'Not logged in'}
          left={(props) => <List.Icon {...props} icon="account" color={COLORS.PRIMARY_1} />}
          onPress={() => {}}
          style={styles.listItem}
        />
        <Divider />

        <List.Subheader style={styles.subheader}>Preferences</List.Subheader>
        <List.Item
          title="Theme"
          description="Dark"
          left={(props) => (
            <List.Icon {...props} icon="theme-light-dark" color={COLORS.PRIMARY_1} />
          )}
          onPress={() => {}}
          style={styles.listItem}
        />
        <List.Item
          title="Notifications"
          description="Enabled"
          left={(props) => <List.Icon {...props} icon="bell" color={COLORS.PRIMARY_1} />}
          onPress={() => {}}
          style={styles.listItem}
        />
        <Divider />

        <List.Subheader style={styles.subheader}>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" color={COLORS.PRIMARY_1} />}
          style={styles.listItem}
        />
        <Divider />

        <List.Item
          title="Logout"
          titleStyle={{ color: COLORS.ERROR }}
          left={(props) => <List.Icon {...props} icon="logout" color={COLORS.ERROR} />}
          onPress={handleLogout}
          style={styles.listItem}
        />
      </List.Section>
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
  subheader: {
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: COLORS.MAIN_BG,
  },
  listItem: {
    backgroundColor: COLORS.MAIN_BG,
  },
});
