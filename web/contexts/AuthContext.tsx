'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User, AuthResponse } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; full_name?: string; role: 'student' | 'lecturer'; user_id?: string }) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const userData = await apiClient.getCurrentUser();
            setUser(userData);
            // Mirror role to cookie for middleware-based gating
            if (typeof document !== 'undefined') {
                const isSecure = window.location.protocol === 'https:';
                document.cookie = `role=${userData.role}; Path=/; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
            }
        } catch {
            // Access token is invalid/expired — attempt a silent refresh
            try {
                const refreshResponse = await apiClient.refreshToken();
                localStorage.setItem('access_token', refreshResponse.access_token);
                if (refreshResponse.refresh_token) {
                    localStorage.setItem('refresh_token', refreshResponse.refresh_token);
                }

                const userData = await apiClient.getCurrentUser();
                setUser(userData);
                if (typeof document !== 'undefined') {
                    const isSecure = window.location.protocol === 'https:';
                    document.cookie = `access_token=${refreshResponse.access_token}; Path=/; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
                    document.cookie = `role=${userData.role}; Path=/; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
                }
            } catch {
                // Refresh also failed — stale session, clear everything silently
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
                if (typeof document !== 'undefined') {
                    document.cookie = `access_token=; Path=/; Max-Age=0;`;
                    document.cookie = `role=; Path=/; Max-Age=0;`;
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const response: AuthResponse = await apiClient.login({ username: email, password });

            // Store tokens
            localStorage.setItem('access_token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
            }
            // Mirror access token to cookie for middleware
            if (typeof document !== 'undefined') {
                const isSecure = window.location.protocol === 'https:';
                document.cookie = `access_token=${response.access_token}; Path=/; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
            }

            // Get user data
            const userData = await apiClient.getCurrentUser();
            setUser(userData);
            // Mirror role cookie for middleware
            if (typeof document !== 'undefined') {
                const isSecure = window.location.protocol === 'https:';
                document.cookie = `role=${userData.role}; Path=/; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
            }

            toast.success('Login successful!');
        } catch (error: any) {
            console.error('Login failed:', error);
            toast.error(error.message || 'Login failed. Please check your credentials.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: { email: string; password: string; full_name?: string; role: 'student' | 'lecturer'; user_id?: string }) => {
        try {
            setLoading(true);
            const userData = await apiClient.register(data);

            // After successful registration, automatically log in
            await login(data.email, data.password);

            toast.success('Account created successfully!');
        } catch (error: any) {
            console.error('Registration failed:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        try {
            apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            toast.success('Logged out successfully');
            if (typeof document !== 'undefined') {
                // Expire cookies for middleware
                document.cookie = `access_token=; Path=/; Max-Age=0;`;
                document.cookie = `role=; Path=/; Max-Age=0;`;
            }
        }
    };

    useEffect(() => {
        refreshAuth();
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
