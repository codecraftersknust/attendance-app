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
    user_id?: string; // student_id or lecturer_id unified
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

    async adminUsers(params: { role?: 'student' | 'lecturer' | 'admin'; limit?: number; offset?: number } = {}): Promise<any[]> {
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

    // Lecturer endpoints
    async lecturerCourses(): Promise<Array<{ id: number; code: string; name: string; description: string | null; semester: string; is_active: boolean; created_at?: string; session_count?: number }>> {
        return this.request('/lecturer/courses');
    }

    async lecturerCreateCourse(payload: { code: string; name: string; description?: string; semester?: string }): Promise<{ id: number; code: string; name: string; description: string | null; semester: string; is_active: boolean }> {
        const qs = new URLSearchParams();
        qs.set('code', payload.code);
        qs.set('name', payload.name);
        if (payload.description) qs.set('description', payload.description);
        if (payload.semester) qs.set('semester', payload.semester);
        return this.request(`/lecturer/courses?${qs.toString()}`, { method: 'POST' });
    }

    async lecturerSessions(): Promise<Array<{ id: number; code: string; is_active: boolean }>> {
        return this.request('/lecturer/sessions');
    }

    async lecturerCreateSession(payload: { course_id: number; duration_minutes?: number }): Promise<{ id: number; code: string; course: { id: number; code: string; name: string }; starts_at: string; ends_at: string }> {
        const qs = new URLSearchParams();
        qs.set('course_id', String(payload.course_id));
        if (payload.duration_minutes != null) qs.set('duration_minutes', String(payload.duration_minutes));
        return this.request(`/lecturer/sessions?${qs.toString()}`, { method: 'POST' });
    }

    async lecturerCloseSession(sessionId: number): Promise<{ id: number; is_active: boolean }> {
        return this.request(`/lecturer/sessions/${sessionId}/close`, { method: 'POST' });
    }

    async lecturerRegenerateSessionCode(sessionId: number): Promise<{ id: number; code: string }> {
        return this.request(`/lecturer/sessions/${sessionId}/regenerate`, { method: 'POST' });
    }

    async lecturerRotateQr(sessionId: number, ttlSeconds: number = 60): Promise<{ session_id: number; nonce: string; expires_at: string; qr_payload: any }> {
        const qs = new URLSearchParams();
        if (ttlSeconds != null) qs.set('ttl_seconds', String(ttlSeconds));
        return this.request(`/lecturer/sessions/${sessionId}/qr/rotate?${qs.toString()}`, { method: 'POST' });
    }

    async lecturerQrStatus(sessionId: number): Promise<{ has_qr: boolean; expires_at: string | null; seconds_remaining: number; is_expired: boolean; next_rotation_in: number }> {
        return this.request(`/lecturer/sessions/${sessionId}/qr/status`);
    }

    async lecturerQrPayload(sessionId: number): Promise<{ session_id: number; nonce: string; expires_at: string; qr_payload: any }> {
        return this.request(`/lecturer/sessions/${sessionId}/qr`);
    }

    async lecturerSessionAttendance(sessionId: number): Promise<Array<{ id: number; student_id: number; status: string; imei: string }>> {
        return this.request(`/lecturer/sessions/${sessionId}/attendance`);
    }

    // Student course endpoints
    async studentSearchCourses(query?: string): Promise<Array<{ id: number; code: string; name: string; description: string | null; semester: string; lecturer_name: string | null; is_enrolled: boolean }>> {
        const qs = new URLSearchParams();
        if (query) qs.set('q', query);
        return this.request(`/student/courses/search${qs.toString() ? `?${qs.toString()}` : ''}`);
    }

    async studentGetCourses(): Promise<Array<{ id: number; code: string; name: string; description: string | null; semester: string; lecturer_name: string | null; enrolled_at: string }>> {
        return this.request('/student/courses');
    }

    async studentEnrollInCourse(courseId: number): Promise<{ id: number; course_id: number; code: string; name: string; enrolled_at: string }> {
        return this.request(`/student/courses/${courseId}/enroll`, { method: 'POST' });
    }

    // Student attendance endpoints
    async studentActiveSessions(): Promise<Array<{ id: number; code: string; course_id: number; course_code?: string; course_name?: string; starts_at?: string; ends_at?: string }>> {
        return this.request('/student/sessions/active');
    }

    async studentBindDevice(imei: string): Promise<{ status: string; imei: string }> {
        const qs = new URLSearchParams({ imei });
        return this.request(`/student/device/bind?${qs.toString()}`, { method: 'POST' });
    }

    async studentEnrollFace(file: File): Promise<{ message: string; path: string }> {
        const form = new FormData();
        form.append('file', file);
        return this.request('/student/enroll-face', {
            method: 'POST',
            headers: {},
            body: form,
        });
    }

    async studentVerifyFace(file: File): Promise<any> {
        const form = new FormData();
        form.append('file', file);
        return this.request('/student/verify-face', {
            method: 'POST',
            headers: {},
            body: form,
        });
    }

    async studentSubmitAttendance(payload: { qr_session_id: number; qr_nonce: string; latitude: number; longitude: number; imei: string; selfie?: File | null }): Promise<any> {
        const form = new FormData();
        form.append('qr_session_id', String(payload.qr_session_id));
        form.append('qr_nonce', payload.qr_nonce);
        form.append('latitude', String(payload.latitude));
        form.append('longitude', String(payload.longitude));
        form.append('imei', payload.imei);
        if (payload.selfie) {
            form.append('selfie', payload.selfie);
        }
        return this.request('/student/attendance', {
            method: 'POST',
            headers: {},
            body: form,
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
