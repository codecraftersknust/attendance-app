/** Browser: same-origin /api/v1 (nginx or Next rewrite). SSR/build: env or localhost. */
function resolveApiBaseUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (fromEnv) return fromEnv;
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/api/v1`;
    }
    return (process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
}

const API_BASE_URL = resolveApiBaseUrl();

export interface User {
    id: number;
    email: string;
    full_name: string | null;
    user_id: string | null;
    role: 'student' | 'lecturer' | 'admin';
    is_active?: boolean;
    created_at?: string;
}

export interface UserProfile {
    id: number;
    email: string;
    full_name: string | null;
    user_id: string | null;
    role: 'student' | 'lecturer' | 'admin';
    level: number | null;
    programme: string | null;
    is_active: boolean;
    has_face_enrolled: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface UserUpdateRequest {
    full_name?: string;
    email?: string;
    user_id?: string;
    level?: number;
    programme?: string;
}

export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
    role: 'student' | 'lecturer';
    user_id?: string;
    level?: number;
    programme?: string;
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
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

        const headers: Record<string, string> = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers as Record<string, string> | undefined),
        };

        const config: RequestInit = {
            ...options,
            headers,
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

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detail = errorData.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail) && detail.length > 0
                    ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') || `HTTP error! status: ${response.status}`
                    : `HTTP error! status: ${response.status}`;
            throw new Error(message);
        }

        return await response.json();
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

    async getProfile(): Promise<UserProfile> {
        return this.request<UserProfile>('/auth/profile');
    }

    async updateProfile(data: UserUpdateRequest): Promise<UserProfile> {
        return this.request<UserProfile>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async changePassword(data: PasswordChangeRequest): Promise<{ message: string }> {
        return this.request<{ message: string }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
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

    async deleteAccount(): Promise<{ message: string }> {
        return this.request<{ message: string }>('/auth/me', {
            method: 'DELETE',
        });
    }

    // Admin endpoints
    async adminListFlagged(): Promise<Array<{
        record_id: number;
        session_id: number;
        student_id: number;
        lecturer_id: number | null;
        device_id_hash: string | null;
        face_verified: boolean | null;
        face_distance: number | null;
        face_threshold: number | null;
        face_model: string | null;
    }>> {
        return this.request('/admin/flagged');
    }

    async adminApproveDeviceReset(userId: number, newDeviceId: string): Promise<{ user_id: number; device_id: string }> {
        return this.request('/admin/device/approve-reset', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, new_device_id: newDeviceId }),
        });
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

    // Admin course management
    async adminGetCourses(params: { search?: string; semester?: string; limit?: number; offset?: number } = {}): Promise<Array<{
        id: number;
        code: string;
        name: string;
        description: string | null;
        semester: string;
        level: number;
        programmes: string[];
        is_active: boolean;
        lecturer_names: string[];
        enrolled_count: number;
        session_count: number;
        created_at: string;
    }>> {
        const qs = new URLSearchParams();
        if (params.search) qs.set('search', params.search);
        if (params.semester) qs.set('semester', params.semester);
        if (params.limit != null) qs.set('limit', String(params.limit));
        if (params.offset != null) qs.set('offset', String(params.offset));
        const q = qs.toString();
        return this.request(`/admin/courses${q ? `?${q}` : ''}`);
    }

    async adminGetCourseDetails(courseId: number): Promise<{
        id: number;
        code: string;
        name: string;
        description: string | null;
        semester: string;
        level: number;
        programmes: string[];
        is_active: boolean;
        lecturer_ids: number[];
        lecturer_names: string[];
        created_at: string;
        enrolled_students: Array<{
            id: number;
            user_id: string | null;
            full_name: string | null;
            email: string;
            enrolled_at: string;
        }>;
        enrolled_count: number;
        recent_sessions: Array<{
            id: number;
            code: string;
            is_active: boolean;
            starts_at: string | null;
            ends_at: string | null;
            attendance_count: number;
        }>;
    }> {
        return this.request(`/admin/courses/${courseId}`);
    }

    async adminCreateCourse(payload: {
        code: string;
        name: string;
        description?: string;
        semester?: string;
        level?: number;
        programmes?: string[];
    }): Promise<{ id: number; code: string; name: string; description: string | null; semester: string; level: number; programmes: string[]; is_active: boolean }> {
        return this.request('/admin/courses', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async adminUpdateCourse(courseId: number, payload: {
        code?: string;
        name?: string;
        description?: string;
        semester?: string;
        level?: number;
        programmes?: string[];
        is_active?: boolean;
    }): Promise<{ id: number; code: string; name: string; description: string | null; semester: string; level: number; programmes: string[]; is_active: boolean }> {
        return this.request(`/admin/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async adminDeleteCourse(courseId: number): Promise<{ deleted: boolean; course_id: number }> {
        return this.request(`/admin/courses/${courseId}`, { method: 'DELETE' });
    }

    // Lecturer endpoints
    async lecturerCourses(): Promise<Array<{ id: number; code: string; name: string; description: string | null; semester: string; is_active: boolean; created_at?: string; session_count?: number; programmes?: string[]; lecturer_names?: string[] }>> {
        return this.request('/lecturer/courses');
    }

    async lecturerCourseDetails(courseId: number): Promise<{
        id: number;
        code: string;
        name: string;
        description: string | null;
        semester: string;
        level: number;
        programmes: string[];
        is_active: boolean;
        created_at: string;
        lecturer_names: string[];
        enrolled_students: Array<{
            id: number;
            user_id: string | null;
            full_name: string | null;
            email: string;
            enrolled_at: string;
        }>;
        enrolled_count: number;
        recent_sessions: Array<{
            id: number;
            code: string;
            is_active: boolean;
            starts_at: string | null;
            ends_at: string | null;
            attendance_count: number;
        }>;
    }> {
        return this.request(`/lecturer/courses/${courseId}`);
    }

    async lecturerBrowseCourses(params?: { search?: string; semester?: string }): Promise<Array<{
        id: number; code: string; name: string; description: string | null; semester: string;
        lecturer_ids: number[]; lecturer_names: string[];
        is_active: boolean; is_claimed: boolean; is_mine: boolean;
        programmes: string[]; created_at: string | null;
    }>> {
        const qs = new URLSearchParams();
        if (params?.search) qs.set('search', params.search);
        if (params?.semester) qs.set('semester', params.semester);
        const query = qs.toString();
        return this.request(`/lecturer/courses/all${query ? `?${query}` : ''}`);
    }

    async lecturerClaimCourse(courseId: number): Promise<{ id: number; code: string; name: string; message: string }> {
        return this.request(`/lecturer/courses/${courseId}/claim`, { method: 'POST' });
    }

    async lecturerUnclaimCourse(courseId: number): Promise<{ id: number; code: string; name: string; unclaimed: boolean; message: string }> {
        return this.request(`/lecturer/courses/${courseId}/unclaim`, { method: 'POST' });
    }

    async lecturerDashboard(): Promise<{
        total_courses: number;
        total_sessions: number;
        active_sessions: number;
        total_attendance_records: number;
        confirmed_records: number;
        flagged_records: number;
    }> {
        return this.request('/lecturer/dashboard');
    }

    async lecturerSessions(): Promise<Array<{
        id: number;
        code: string;
        is_active: boolean;
        programme?: string | null;
        course_id?: number | null;
        course_code?: string | null;
        course_name?: string | null;
        starts_at?: string | null;
        ends_at?: string | null;
        time_remaining_seconds?: number | null;
        attendance_summary?: {
            submitted: number;
            present: number;
            flagged: number;
            pending: number;
            absent: number;
        };
    }>> {
        return this.request('/lecturer/sessions');
    }

    async lecturerCreateSession(payload: { course_id: number; duration_minutes?: number; programme?: string; latitude?: number; longitude?: number; geofence_radius_m?: number }): Promise<{ id: number; code: string; course: { id: number; code: string; name: string }; programme: string | null; duration_minutes: number; time_remaining_seconds: number; starts_at: string; ends_at: string }> {
        return this.request('/lecturer/sessions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
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

    async lecturerSessionAttendance(sessionId: number): Promise<Array<{
        id: number;
        student_id: number;
        student_name?: string | null;
        student_email?: string | null;
        status: string;
        device_id_hash: string | null;
        flag_reasons?: string[];
    }>> {
        return this.request(`/lecturer/sessions/${sessionId}/attendance`);
    }

    async lecturerConfirmFlagged(recordId: number): Promise<{ record_id: number; status: string }> {
        return this.request(`/lecturer/attendance/${recordId}/confirm`, { method: "POST", body: JSON.stringify({}) });
    }

    async lecturerRejectFlagged(recordId: number): Promise<{ record_id: number; status: string }> {
        return this.request(`/lecturer/attendance/${recordId}/reject`, { method: "POST", body: JSON.stringify({}) });
    }

    async lecturerSessionAnalytics(sessionId: number): Promise<{
        total_students: number;
        present_count: number;
        late_count: number;
        absent_count: number;
        flagged_count: number;
        attendance_rate: number;
    }> {
        return this.request(`/lecturer/sessions/${sessionId}/analytics`);
    }

    async lecturerQrDisplay(sessionId: number): Promise<{
        session_id: number;
        session_code: string;
        qr_payload: any;
        qr_data: string;
        expires_at: string;
        time_remaining_seconds: number;
        is_expired: boolean;
        lecturer_name: string;
        session_ends_at?: string;
        session_time_remaining_seconds?: number | null;
    }> {
        return this.request(`/lecturer/qr/${sessionId}/display`);
    }



    // Programmes (public canonical list)
    async listProgrammes(): Promise<string[]> {
        return this.request('/auth/programmes');
    }

    // Student course endpoints
    async studentSearchCourses(query?: string): Promise<Array<{ id: number; code: string; name: string; description: string | null; semester: string; lecturer_names: string[]; is_enrolled: boolean }>> {
        const qs = new URLSearchParams();
        if (query) qs.set('q', query);
        return this.request(`/student/courses/search${qs.toString() ? `?${qs.toString()}` : ''}`);
    }

    async studentGetCourses(): Promise<Array<{ id: number; code: string; name: string; description: string | null; semester: string; lecturer_names: string[]; enrolled_at: string }>> {
        return this.request('/student/courses');
    }

    async studentEnrollInCourse(courseId: number): Promise<{ id: number; course_id: number; code: string; name: string; enrolled_at: string }> {
        return this.request(`/student/courses/${courseId}/enroll`, { method: 'POST' });
    }

    async studentUnenrollFromCourse(courseId: number): Promise<{ unenrolled: boolean; course_id: number }> {
        return this.request(`/student/courses/${courseId}/enroll`, { method: 'DELETE' });
    }

    async studentDashboard(): Promise<{
        enrolled_courses: number;
        total_sessions: number;
        attendance_marked_count: number;
        confirmed_count: number;
        pending_count?: number;
        profile_complete: boolean;
        enrollment_open: boolean;
        current_semester: string;
        is_on_break: boolean;
        academic_year: string;
    }> {
        return this.request('/student/dashboard');
    }

    async studentGetRecommendedCourses(): Promise<Array<{
        id: number; code: string; name: string; description: string | null;
        semester: string; level: number; programmes: string[];
        lecturer_names: string[]; is_enrolled: boolean;
    }>> {
        return this.request('/student/courses/recommended');
    }

    // Student attendance endpoints
    async studentActiveSessions(): Promise<Array<{ id: number; code: string; course_id: number; course_code?: string; course_name?: string; programme?: string | null; starts_at?: string; ends_at?: string; time_remaining_seconds?: number | null; already_marked?: boolean; attendance_status?: string }>> {
        return this.request('/student/sessions/active');
    }

    async studentDeviceStatus(): Promise<{ has_device: boolean; is_active: boolean; has_face_enrolled: boolean }> {
        return this.request('/student/device/status');
    }

    async studentBindDevice(deviceId: string): Promise<{ status: string }> {
        return this.request('/student/device/bind', {
            method: 'POST',
            body: JSON.stringify({ device_id: deviceId }),
        });
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

    async studentSubmitAttendance(payload: { qr_session_id: number; qr_nonce: string; latitude: number; longitude: number; device_id: string; selfie?: File | null }): Promise<any> {
        const form = new FormData();
        form.append('qr_session_id', String(payload.qr_session_id));
        form.append('qr_nonce', payload.qr_nonce);
        form.append('latitude', String(payload.latitude));
        form.append('longitude', String(payload.longitude));
        form.append('device_id', payload.device_id);
        if (payload.selfie) {
            form.append('selfie', payload.selfie);
        }
        return this.request('/student/attendance', {
            method: 'POST',
            headers: {},
            body: form,
        });
    }

    async studentGetAttendanceRecord(recordId: number): Promise<{
        record_id: number;
        status: string;
        flag_reasons?: string[] | null;
        face_verification_pending: boolean;
    }> {
        return this.request(`/student/attendance/records/${recordId}`);
    }

    async lecturerGetAbsentStudents(sessionId: number): Promise<Array<{
        id: number;
        user_id: string | null;
        full_name: string | null;
        email: string;
        status: string;
    }>> {
        return this.request(`/lecturer/sessions/${sessionId}/absent`);
    }

    async studentGetAttendanceHistory(): Promise<Array<{
        session_id: number;
        session_code: string;
        course_code: string;
        course_name: string;
        starts_at: string | null;
        ends_at: string | null;
        status: string;
        record_id: number | null;
    }>> {
        return this.request('/student/attendance/history');
    }

    // ── School Settings ────────────────────────────────────────────

    async adminGetSchoolSettings(): Promise<{
        current_semester: string;
        is_on_break: boolean;
        enrollment_open: boolean;
        academic_year: string;
        updated_at: string | null;
    }> {
        return this.request('/admin/school-settings');
    }

    async adminUpdateSchoolSettings(data: {
        current_semester?: string;
        is_on_break?: boolean;
        enrollment_open?: boolean;
        academic_year?: string;
    }): Promise<{
        current_semester: string;
        is_on_break: boolean;
        enrollment_open: boolean;
        academic_year: string;
        updated_at: string | null;
    }> {
        const qs = new URLSearchParams();
        if (data.current_semester !== undefined) qs.set('current_semester', data.current_semester);
        if (data.is_on_break !== undefined) qs.set('is_on_break', String(data.is_on_break));
        if (data.enrollment_open !== undefined) qs.set('enrollment_open', String(data.enrollment_open));
        if (data.academic_year !== undefined) qs.set('academic_year', data.academic_year);
        return this.request(`/admin/school-settings?${qs.toString()}`, { method: 'PUT' });
    }

    async adminCloseSemester(): Promise<{
        semester_closed: string;
        sessions_closed: number;
        students_unenrolled: number;
        levels_updated: number;
        school_status: string;
    }> {
        return this.request('/admin/semester/close', { method: 'POST' });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);


