import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
  ASSISTANTS: '@assistants',
  CHATS: '@chats',
} as const;

export const storage = {
  // Token management
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.USER_TOKEN);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_TOKEN);
  },

  // User data
  async saveUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
  },

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_DATA);
  },

  // Generic methods
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};
