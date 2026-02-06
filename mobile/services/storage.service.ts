/**
 * Storage Service
 * 
 * Wrapper for AsyncStorage to handle token and user data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import type { User } from '@/types/auth.types';

class StorageService {
    /**
     * Store access token
     */
    async setAccessToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        } catch (error) {
            console.error('Error storing access token:', error);
            throw error;
        }
    }

    /**
     * Retrieve access token
     */
    async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        } catch (error) {
            console.error('Error retrieving access token:', error);
            return null;
        }
    }

    /**
     * Store refresh token
     */
    async setRefreshToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
        } catch (error) {
            console.error('Error storing refresh token:', error);
            throw error;
        }
    }

    /**
     * Retrieve refresh token
     */
    async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error('Error retrieving refresh token:', error);
            return null;
        }
    }

    /**
     * Store user data
     */
    async setUserData(user: User): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
        }
    }

    /**
     * Retrieve user data
     */
    async getUserData(): Promise<User | null> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving user data:', error);
            return null;
        }
    }

    /**
     * Clear all stored tokens and user data
     */
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.USER_DATA,
            ]);
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated (has valid token)
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await this.getAccessToken();
        return !!token;
    }
}

export default new StorageService();
