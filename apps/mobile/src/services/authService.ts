import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_KEY = 'bgos_access_token';
const REFRESH_TOKEN_KEY = 'bgos_refresh_token';
const USER_DATA_KEY = 'bgos_user_data';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
}

/**
 * Mobile Authentication Service
 * Handles secure token storage using react-native-keychain
 * iOS: Uses Keychain
 * Android: Uses Keystore
 */
class AuthService {
  /**
   * Store authentication tokens securely
   */
  async setTokens(tokens: Tokens): Promise<void> {
    try {
      await Keychain.setGenericPassword(
        ACCESS_TOKEN_KEY,
        JSON.stringify(tokens),
        {
          service: 'com.bgos.tokens',
        }
      );
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve authentication tokens from secure storage
   */
  async getTokens(): Promise<Tokens | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.bgos.tokens',
      });

      if (credentials) {
        return JSON.parse(credentials.password);
      }

      return null;
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  }

  /**
   * Store user data securely
   */
  async setUserData(userData: UserData): Promise<void> {
    try {
      await Keychain.setGenericPassword(
        USER_DATA_KEY,
        JSON.stringify(userData),
        {
          service: 'com.bgos.userdata',
        }
      );
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve user data from secure storage
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.bgos.userdata',
      });

      if (credentials) {
        return JSON.parse(credentials.password);
      }

      return null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Remove all authentication data from secure storage
   */
  async clearAuth(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: 'com.bgos.tokens',
      });
      await Keychain.resetGenericPassword({
        service: 'com.bgos.userdata',
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null && tokens.accessToken !== '';
  }

  /**
   * Login user and store credentials
   */
  async login(
    accessToken: string,
    refreshToken: string,
    userData: UserData
  ): Promise<void> {
    await this.setTokens({ accessToken, refreshToken });
    await this.setUserData(userData);
  }

  /**
   * Logout user and clear all stored credentials
   */
  async logout(): Promise<void> {
    await this.clearAuth();
  }
}

export default new AuthService();
