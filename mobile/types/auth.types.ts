/**
 * Authentication Types
 */

export interface LoginRequest {
    username: string; // Can be email or student ID
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
    user_id?: string; // Student ID
    role?: 'student' | 'lecturer' | 'admin';
    level?: number;
    programme?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
    token_type: string;
}

export interface User {
    id: number;
    email: string;
    full_name?: string;
    user_id?: string;
    role: 'student' | 'lecturer' | 'admin';
    face_reference_path?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
