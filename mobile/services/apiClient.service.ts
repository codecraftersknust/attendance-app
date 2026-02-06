/**
 * API Client Service
 * 
 * Provides typed API methods similar to web implementation
 */

import apiClient from './api';
import type { DashboardStats, Course } from '@/types/api.types';

class ApiClientService {
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
}

export default new ApiClientService();
