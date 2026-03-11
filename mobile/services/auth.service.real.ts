import apiClient from './api';
import StorageService from './storage.service';
import type { LoginRequest, RegisterRequest, AuthTokens, AuthResponse, User } from '@/types/auth.types';

class AuthService {
    async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
        // OAuth2 expects form data, not JSON
        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await apiClient.post<AuthResponse>('/auth/login', formData.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token, refresh_token, token_type, user } = response.data;
        const tokens: AuthTokens = { access_token, refresh_token, token_type };
        await StorageService.setAccessToken(tokens.access_token);
        if (refresh_token) {
            await StorageService.setRefreshToken(refresh_token);
        }

        // Some backends might not yet return the user in /auth/login.
        // Fallback to /auth/me when user is missing.
        const resolvedUser = user ?? (await this.getCurrentUser());
        await StorageService.setUserData(resolvedUser);
        return { user: resolvedUser, tokens };
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
