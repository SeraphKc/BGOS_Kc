import { storage } from '../utils/storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    preferences: {
      theme: 'dark' | 'light';
      language: string;
      notifications: boolean;
    };
  };
  token: string;
}

class AuthService {
  /**
   * Login user with credentials
   * TODO: Replace with actual n8n backend call
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Mock implementation - replace with actual API call
    // const response = await apiClient.post('/auth/login', credentials);

    // For now, return mock data
    const mockResponse: AuthResponse = {
      user: {
        id: '1',
        name: credentials.email.split('@')[0],
        email: credentials.email,
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
        },
      },
      token: 'mock-jwt-token-' + Date.now(),
    };

    // Save token to storage
    await storage.saveToken(mockResponse.token);
    await storage.saveUserData(mockResponse.user);

    return mockResponse;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await storage.removeToken();
    await storage.removeUserData();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getToken();
    return !!token;
  }

  /**
   * Get stored token
   */
  async getToken(): Promise<string | null> {
    return await storage.getToken();
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<any | null> {
    return await storage.getUserData();
  }
}

export const authService = new AuthService();
