/**
 * Student Feature Types
 */

export interface DeviceBindRequest {
    device_id: string;
}

export interface DeviceStatus {
    is_bound: boolean;
    device_id_hash?: string;
}

export interface AttendanceSubmission {
    qr_session_id: number;
    qr_nonce: string;
    latitude: number;
    longitude: number;
    device_id: string;
    selfie: File | Blob;
}

export interface AttendanceRecord {
    id: number;
    session_id: number;
    student_id: number;
    device_id_hash: string;
    selfie_image_path?: string;
    status: 'confirmed' | 'flagged';
    created_at: string;
}

export interface Course {
    id: number;
    code: string;
    name: string;
    description?: string;
    semester: string;
    lecturer_id: number;
    lecturer_name?: string;
    is_active: boolean;
}

export interface QRPayload {
    session_id: number;
    nonce: string;
    expires_at: string;
    lecturer_name?: string;
    course_code?: string;
    course_name?: string;
    location?: {
        latitude?: number;
        longitude?: number;
        radius_m?: number;
    };
    session_code?: string;
}
