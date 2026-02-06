/**
 * Course Service
 * 
 * Handles course-related API calls for students
 */

import apiClient from './api';
import type { Course } from '@/types/api.types';

interface EnrollmentResponse {
    id: number;
    course_id: number;
    code: string;
    name: string;
    enrolled_at: string;
}

class CourseService {
    /**
     * Search for courses by code or name
     * @param query - Optional search query (searches code and name)
     * @returns Array of courses with enrollment status
     */
    async searchCourses(query?: string): Promise<Course[]> {
        const params = query ? { q: query } : {};
        const response = await apiClient.get<Course[]>('/student/courses/search', { params });
        return response.data;
    }

    /**
     * Get all courses the student is enrolled in
     * @returns Array of enrolled courses with enrollment dates
     */
    async getEnrolledCourses(): Promise<Course[]> {
        const response = await apiClient.get<Course[]>('/student/courses');
        return response.data;
    }

    /**
     * Enroll in a course
     * @param courseId - The ID of the course to enroll in
     * @returns Enrollment details
     */
    async enrollInCourse(courseId: number): Promise<EnrollmentResponse> {
        const response = await apiClient.post<EnrollmentResponse>(`/student/courses/${courseId}/enroll`);
        return response.data;
    }
}

export default new CourseService();
