import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '@/services/auth.service';
import type { User, AuthState } from '@/types/auth.types';
import type { LoginRequest, RegisterRequest } from '@/types/auth.types';

interface AuthContextType extends AuthState {
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        loadAuth();
    }, []);

    const loadAuth = async () => {
        setIsLoading(true);
        const user = await AuthService.checkAuth();

        if (user) {
            setUser(user);
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    };

    const login = async (credentials: LoginRequest) => {
        const { user } = await AuthService.login(credentials);
        setUser(user);
        setIsAuthenticated(true);
    };

    const register = async (data: RegisterRequest) => {
        const { user } = await AuthService.register(data);
        setUser(user);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const refreshUser = async () => {
        const user = await AuthService.getCurrentUser();
        setUser(user);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
