import apiClient from './api';
import StorageService from './storage.service';
import type { LoginRequest, RegisterRequest, AuthTokens, User } from '@/types/auth.types';

class AuthService {
    async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
        // OAuth2 expects form data, not JSON
        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await apiClient.post<AuthTokens>('/auth/login', formData.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokens = response.data;
        await StorageService.setAccessToken(tokens.access_token);
        if (tokens.refresh_token) {
            await StorageService.setRefreshToken(tokens.refresh_token);
        }

        const user = await this.getCurrentUser();
        return { user, tokens };
    }

    async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
        await apiClient.post<User>('/auth/register', {
            ...data,
            role: data.role || 'student',
        });

        // auto-login
        return this.login({
            username: data.email,
            password: data.password,
        });
    }

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/auth/me');
        const user = response.data;
        await StorageService.setUserData(user);
        return user;
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // backend might not have logout endpoint
        }
        await StorageService.clearAll();
    }

    async checkAuth(): Promise<User | null> {
        const isAuth = await StorageService.isAuthenticated();
        if (!isAuth) return null;

        // try cached first
        let user = await StorageService.getUserData();
        if (!user) {
            try {
                user = await this.getCurrentUser();
            } catch (err) {
                console.log('auth check failed', err);
                await StorageService.clearAll();
                return null;
            }
        }

        return user;
    }
}

export default new AuthService();
