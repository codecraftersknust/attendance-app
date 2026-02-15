import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useToast } from '@/contexts/ToastContext';
import apiClientService from '@/services/apiClient.service';
import type { DashboardStats, Course, AttendanceHistoryItem } from '@/types/api.types';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentSessions, setRecentSessions] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user initials
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Calculate attendance percentage (confirmed out of total past sessions)
  const getAttendancePercentage = () => {
    if (!stats || stats.total_sessions === 0) return 0;
    return Math.round((stats.confirmed_count / stats.total_sessions) * 100 * 10) / 10;
  };

  // Get status label
  const getStatusLabel = (percentage: number) => {
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'At Risk';
  };

  // Get status color
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return colors.tint;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      let dashboardStats: DashboardStats | null = null;
      try {
        dashboardStats = await apiClientService.studentDashboard();
      } catch (statsError: any) {
        console.error('Failed to load dashboard stats:', statsError);
        throw new Error(`Dashboard stats: ${statsError?.message || 'Unknown error'}`);
      }

      let enrolledCourses: Course[] = [];
      try {
        enrolledCourses = await apiClientService.studentGetCourses();
      } catch (coursesError: any) {
        console.error('Failed to load courses:', coursesError);
        throw new Error(`Courses: ${coursesError?.message || 'Unknown error'}`);
      }

      let history: AttendanceHistoryItem[] = [];
      try {
        history = await apiClientService.getAttendanceHistory();
      } catch (historyError: any) {
        console.error('Failed to load attendance history:', historyError);
        // Non-critical: don't throw, just show empty recent sessions
      }

      setStats(dashboardStats);
      setCourses(enrolledCourses);
      setRecentSessions(history.slice(0, 5));
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleMarkAttendance = () => {
    router.push('/(tabs)/attendance');
  };

  const handleViewHistory = () => {
    router.push({ pathname: '/(tabs)/attendance', params: { tab: 'history' } });
  };

  const getSessionStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: Emerald[100], color: Emerald[700] };
      case 'flagged':
        return { backgroundColor: '#fef3c7', color: '#d97706' };
      case 'absent':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getStatusDisplayLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'PRESENT';
      case 'flagged':
        return 'FLAGGED';
      case 'absent':
        return 'ABSENT';
      default:
        return status.toUpperCase();
    }
  };

  const formatSessionTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const attendancePercentage = getAttendancePercentage();
  const statusLabel = getStatusLabel(attendancePercentage);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.userSection}>
            <View style={[styles.initialsCircle, { backgroundColor: colors.tint }]}>
              <Text style={styles.initialsText}>
                {getInitials(user?.full_name || user?.email)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
                Welcome back,
              </Text>
              {user && (
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user.full_name || user.email}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.tint + '15' }]}
          >
            <IconSymbol name="bell.fill" size={22} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Loading dashboard...
          </Text>
        </View>
      ) : (
        <>
          {/* Overall Attendance Card */}
          <View style={[styles.attendanceCard, { backgroundColor: colors.tint }]}>
            <View style={styles.attendanceCardContent}>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceLabel}>Overall Attendance</Text>
                <Text style={styles.attendancePercentage}>{attendancePercentage}%</Text>
                <Text style={styles.attendanceSubtitle}>
                  {stats?.confirmed_count || 0}/{stats?.total_sessions || 0} Classes Attended
                </Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.attendanceButtons}>
              <TouchableOpacity
                style={styles.attendanceActionButton}
                onPress={handleMarkAttendance}
              >
                <IconSymbol name="qrcode" size={16} color={colors.tint} />
                <Text style={[styles.attendanceActionText, { color: colors.tint }]}>Check In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attendanceActionButtonReports}
                onPress={handleViewHistory}
              >
                <IconSymbol name="chart.bar.fill" size={16} color='#ffffff' />
                <Text style={styles.attendanceActionText}>Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Sessions Section */}
          <View style={styles.sessionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Sessions
              </Text>
              <TouchableOpacity onPress={handleViewHistory}>
                <Text style={[styles.viewAllText, { color: colors.tint }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="calendar" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No recent sessions
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                  Your attendance history will appear here
                </Text>
              </View>
            ) : (
              <>
                {recentSessions.map((session) => {
                  const statusStyle = getSessionStatusStyle(session.status);
                  return (
                    <View
                      key={session.session_id}
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                          borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                        },
                      ]}
                    >
                      <View style={styles.sessionContent}>
                        <View style={styles.sessionDetails}>
                          <Text style={[styles.sessionName, { color: colors.text }]} numberOfLines={1}>
                            {session.course_name}
                          </Text>
                          <View style={styles.sessionMeta}>
                            <Text style={[styles.sessionProfessor, { color: colors.tabIconDefault }]}>
                              {session.course_code} {session.ends_at ? `· ${formatSessionTime(session.ends_at)}` : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.sessionStatusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                          <Text style={[styles.sessionStatusText, { color: statusStyle.color }]}>
                            {getStatusDisplayLabel(session.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Overall Attendance Card
  attendanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  attendanceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  attendancePercentage: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendanceSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  attendanceActionButtonReports: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  attendanceActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Sessions Section
  sessionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sessionTimeBar: {
    width: 4,
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sessionTime: {
    marginRight: 16,
    alignItems: 'center',
  },
  sessionTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionTimeSeparator: {
    fontSize: 10,
  },
  sessionDetails: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLocation: {
    fontSize: 12,
  },
  sessionDot: {
    fontSize: 10,
    marginHorizontal: 6,
  },
  sessionProfessor: {
    fontSize: 12,
  },
  sessionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
