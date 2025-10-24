const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface User {
    id: number;
    email: string;
    full_name: string | null;
    role: 'student' | 'lecturer' | 'admin';
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
    role: 'student' | 'lecturer';
    student_id?: string;
}

export interface LoginRequest {
    username: string; // email
    password: string;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add auth token if available (localStorage first, then cookie fallback)
        if (typeof window !== 'undefined') {
            let token = localStorage.getItem('access_token');
            if (!token && typeof document !== 'undefined') {
                const match = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
                token = match ? decodeURIComponent(match[1]) : null;
            }
            if (token) {
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${token}`,
                };
            }
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(data: RegisterRequest): Promise<User> {
        return this.request<User>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);

        return this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            headers: {
                // Remove Content-Type to let browser set it for FormData
            },
            body: formData,
        });
    }

    async getCurrentUser(): Promise<User> {
        return this.request<User>('/auth/me');
    }

    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        return this.request<AuthResponse>('/auth/refresh', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        });
    }

    async logout(): Promise<void> {
        await this.request('/auth/logout', {
            method: 'POST',
        });
    }

    // Admin endpoints
    async adminListFlagged(): Promise<Array<{
        record_id: number;
        session_id: number;
        student_id: number;
        lecturer_id: number | null;
        imei: string | null;
        face_verified: boolean | null;
        face_distance: number | null;
        face_threshold: number | null;
        face_model: string | null;
    }>> {
        return this.request('/admin/flagged');
    }

    async adminApproveImeiReset(userId: number, newImei: string): Promise<{ user_id: number; imei: string }> {
        const qs = new URLSearchParams({ user_id: String(userId), new_imei: newImei }).toString();
        return this.request(`/admin/imei/approve-reset?${qs}`, { method: 'POST' });
    }

    async adminDashboard(): Promise<any> {
        return this.request('/admin/dashboard');
    }

    async adminSessions(params: { active_only?: boolean; limit?: number; offset?: number } = {}): Promise<any[]> {
        const qs = new URLSearchParams();
        if (params.active_only) qs.set('active_only', 'true');
        if (params.limit != null) qs.set('limit', String(params.limit));
        if (params.offset != null) qs.set('offset', String(params.offset));
        const q = qs.toString();
        return this.request(`/admin/sessions${q ? `?${q}` : ''}`);
    }

    async adminUsers(params: { role?: 'student'|'lecturer'|'admin'; limit?: number; offset?: number } = {}): Promise<any[]> {
        const qs = new URLSearchParams();
        if (params.role) qs.set('role', params.role);
        if (params.limit != null) qs.set('limit', String(params.limit));
        if (params.offset != null) qs.set('offset', String(params.offset));
        const q = qs.toString();
        return this.request(`/admin/users${q ? `?${q}` : ''}`);
    }

    async adminSessionAttendance(sessionId: number): Promise<any[]> {
        return this.request(`/admin/sessions/${sessionId}/attendance`);
    }

    async adminActivity(params: { hours?: number; limit?: number } = {}): Promise<any> {
        const qs = new URLSearchParams();
        if (params.hours != null) qs.set('hours', String(params.hours));
        if (params.limit != null) qs.set('limit', String(params.limit));
        const q = qs.toString();
        return this.request(`/admin/activity${q ? `?${q}` : ''}`);
    }

    async adminManualMark(body: { session_id: number; student_id: number; status?: string; reason?: string }): Promise<any> {
        const qs = new URLSearchParams();
        qs.set('session_id', String(body.session_id));
        qs.set('student_id', String(body.student_id));
        if (body.status) qs.set('status', body.status);
        if (body.reason) qs.set('reason', body.reason);
        return this.request(`/admin/attendance/manual-mark?${qs.toString()}`, { method: 'POST' });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
