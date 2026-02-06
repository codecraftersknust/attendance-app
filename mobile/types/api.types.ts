/**
 * Common API Response Types
 */

export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    success?: boolean;
    error?: string;
}

export interface ApiError {
    message: string;
    status?: number;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface DashboardStats {
    enrolled_courses: number;
    attendance_marked_count: number;
    confirmed_count: number;
}

export interface Course {
    id: number;
    code: string;
    name: string;
    description: string | null;
    semester: string;
    lecturer_name: string | null;
    is_enrolled?: boolean;
    enrolled_at?: string;
}

export interface ActiveSession {
    id: number;
    code: string;
    course_id: number;
    course_code?: string;
    course_name?: string;
    starts_at?: string;
    ends_at?: string;
}

export interface DeviceStatus {
    has_device: boolean;
    is_active: boolean;
    has_face_enrolled: boolean;
}

export interface AttendanceSubmission {
    qr_session_id: number;
    qr_nonce: string;
    latitude: number;
    longitude: number;
    device_id: string;
    selfie?: any; // File or URI depending on platform
}


