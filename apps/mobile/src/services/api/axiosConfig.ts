import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AuthService from '../AuthService';

/**
 * Mobile API Client with automatic token injection and refresh
 */
class MobileAPIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add access token to headers
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = await AuthService.getTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle token refresh on 401
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and haven't retried yet, attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await AuthService.getTokens();
            
            if (tokens?.refreshToken) {
              // Attempt to refresh the token
              const response = await axios.post(
                `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/auth/refresh`,
                { refreshToken: tokens.refreshToken }
              );

              const { accessToken, refreshToken } = response.data;

              // Store new tokens
              await AuthService.setTokens({ accessToken, refreshToken });

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - logout user
            await AuthService.logout();
            // TODO: Navigate to login screen
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export default new MobileAPIClient().getInstance();
