/**
 * API Client Service
 * 
 * Provides typed API methods similar to web implementation
 */

import apiClient from './api';
import type { DashboardStats, Course, AttendanceHistoryItem } from '@/types/api.types';

export interface UserProfile {
    id: number;
    email: string;
    full_name: string | null;
    user_id: string | null;
    role: string;
    is_active: boolean;
    has_face_enrolled: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface UserUpdateRequest {
    full_name?: string;
    email?: string;
    user_id?: string;
}

export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
}

class ApiClientService {
    /**
     * Get user profile
     */
    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.get<UserProfile>('/auth/profile');
        return response.data;
    }

    /**
     * Update user profile
     */
    async updateProfile(data: UserUpdateRequest): Promise<UserProfile> {
        const response = await apiClient.put<UserProfile>('/auth/profile', data);
        return response.data;
    }

    /**
     * Change password
     */
    async changePassword(data: PasswordChangeRequest): Promise<{ message: string }> {
        const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
        return response.data;
    }

    /**
     * Get student dashboard statistics
     */
    async studentDashboard(): Promise<DashboardStats> {
        const response = await apiClient.get<DashboardStats>('/student/dashboard');
        return response.data;
    }

    /**
     * Get enrolled courses
     */
    async studentGetCourses(): Promise<Course[]> {
        const response = await apiClient.get<Course[]>('/student/courses');
        return response.data;
    }

    /**
     * Search courses
     */
    async studentSearchCourses(query: string): Promise<Course[]> {
        const response = await apiClient.get<Course[]>('/student/courses/search', {
            params: { q: query }
        });
        return response.data;
    }

    /**
     * Enroll in course
     */
    async studentEnrollInCourse(courseId: number): Promise<any> {
        const response = await apiClient.post(`/student/courses/${courseId}/enroll`);
        return response.data;
    }

    /**
     * Unenroll from course
     */
    async studentUnenrollFromCourse(courseId: number): Promise<any> {
        const response = await apiClient.delete(`/student/courses/${courseId}/enroll`);
        return response.data;
    }

    /**
     * Get attendance history (past sessions with status)
     */
    async getAttendanceHistory(): Promise<AttendanceHistoryItem[]> {
        const response = await apiClient.get<AttendanceHistoryItem[]>('/student/attendance/history');
        return response.data;
    }
}

export default new ApiClientService();
