/**
 * API Client
 * 
 * Configured Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/constants/config';
import StorageService from './storage.service';
import type { ApiError } from '@/types/api.types';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach auth token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await StorageService.getAccessToken();

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh and errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await StorageService.getRefreshToken();

                if (!refreshToken) {
                    // No refresh token available, redirect to login
                    await StorageService.clearAll();
                    throw error;
                }

                // Attempt to refresh the token
                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}/auth/refresh`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`
                        }
                    }
                );

                const { access_token, refresh_token: newRefreshToken } = response.data;

                // Store new tokens
                await StorageService.setAccessToken(access_token);
                if (newRefreshToken) {
                    await StorageService.setRefreshToken(newRefreshToken);
                }

                // Retry original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                await StorageService.clearAll();
                return Promise.reject(refreshError);
            }
        }

        // Transform error to consistent format
        // FastAPI returns errors in 'detail' field, not 'message'
        const apiError: ApiError = {
            message: (error.response?.data as any)?.detail || (error.response?.data as any)?.message || error.message || 'An error occurred',
            status: error.response?.status,
            errors: (error.response?.data as any)?.errors,
        };

        return Promise.reject(apiError);
    }
);

export default apiClient;
