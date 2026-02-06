/**
 * Dashboard Service
 * 
 * Handles dashboard-related API calls for students
 */

import apiClient from './api';
import type { DashboardStats } from '@/types/api.types';

class DashboardService {
    /**
     * Get student dashboard statistics
     * @returns Dashboard stats including enrolled courses, attendance counts, and confirmation counts
     */
    async getStudentDashboard(): Promise<DashboardStats> {
        const response = await apiClient.get<DashboardStats>('/student/dashboard');
        return response.data;
    }
}

export default new DashboardService();
