import * as Keychain from 'react-native-keychain';

const CLERK_TOKEN_SERVICE = 'com.bgos.clerk.tokens';

/**
 * Token cache for Clerk authentication
 * Uses react-native-keychain for secure storage
 * - iOS: Keychain
 * - Android: Keystore
 */
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${CLERK_TOKEN_SERVICE}.${key}`,
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Clerk tokenCache getToken error:', error);
      return null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(key, value, {
        service: `${CLERK_TOKEN_SERVICE}.${key}`,
      });
    } catch (error) {
      console.error('Clerk tokenCache saveToken error:', error);
    }
  },

  async clearToken(key: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: `${CLERK_TOKEN_SERVICE}.${key}`,
      });
    } catch (error) {
      console.error('Clerk tokenCache clearToken error:', error);
    }
  },
};
