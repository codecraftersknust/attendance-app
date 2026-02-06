/**
 * Attendance Service
 * 
 * Handles attendance-related API calls for students
 */

import apiClient from './api';
import type { ActiveSession, DeviceStatus, AttendanceSubmission } from '@/types/api.types';

class AttendanceService {
    /**
     * Get all active attendance sessions for enrolled courses
     * @returns Array of active sessions
     */
    async getActiveSessions(): Promise<ActiveSession[]> {
        const response = await apiClient.get<ActiveSession[]>('/student/sessions/active');
        return response.data;
    }

    /**
     * Check device binding and face enrollment status
     * @returns Device status information
     */
    async getDeviceStatus(): Promise<DeviceStatus> {
        const response = await apiClient.get<DeviceStatus>('/student/device/status');
        return response.data;
    }

    /**
     * Bind a device ID to the current user
     * @param deviceId - Unique device identifier
     * @returns Status response
     */
    async bindDevice(deviceId: string): Promise<{ status: string }> {
        const response = await apiClient.post<{ status: string }>('/student/device/bind', null, {
            params: { device_id: deviceId }
        });
        return response.data;
    }

    /**
     * Enroll reference face image
     * @param imageUri - URI or File object of the reference face photo
     * @returns Upload result
     */
    async enrollFace(imageUri: string): Promise<{ message: string; path: string }> {
        const formData = new FormData();

        // Create file object from URI
        const filename = imageUri.split('/').pop() || 'reference.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri: imageUri,
            name: filename,
            type: type,
        } as any);

        const response = await apiClient.post<{ message: string; path: string }>(
            '/student/enroll-face',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Submit attendance with all required data
     * @param data - Attendance submission data
     * @returns Attendance record response
     */
    async submitAttendance(data: AttendanceSubmission): Promise<any> {
        const formData = new FormData();

        formData.append('qr_session_id', data.qr_session_id.toString());
        formData.append('qr_nonce', data.qr_nonce);
        formData.append('latitude', data.latitude.toString());
        formData.append('longitude', data.longitude.toString());
        formData.append('device_id', data.device_id);

        if (data.selfie) {
            const filename = data.selfie.split('/').pop() || 'selfie.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('selfie', {
                uri: data.selfie,
                name: filename,
                type: type,
            } as any);
        }

        const response = await apiClient.post('/student/attendance', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
}

export default new AttendanceService();
